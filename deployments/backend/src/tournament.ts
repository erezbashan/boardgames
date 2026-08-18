import { onCall } from 'firebase-functions/v2/https';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { runSimulationBatch as coreRunSimulationBatch } from "@erez/boardgame-core/dist/engine/simulateGame";
import { getGame } from "@erez/boardgame-core";

const CHUNK_SIZE = 1000;

export const startTournament = onCall(async (request) => {
  const { gameType, bots: inputBots } = request.data;
  const db = getFirestore();

  if (!inputBots || !Array.isArray(inputBots)) {
    throw new Error('Bots array is required to start a tournament.');
  }

  const bots = inputBots.map((b: any) => ({
    id: b.id,
    config: b.config,
    wins: 0,
    gamesPlayed: 0,
    eliminated: false
  }));

  const totalGamesInPhase = bots.length * 1000;

  const simRef = db.collection('tournament_simulations').doc();
  await simRef.set({
    status: 'running',
    gameType: gameType || 'king-of-tokyo',
    phase: 1,
    gamesCompletedInPhase: 0,
    totalGamesInPhase,
    bots,
    createdAt: new Date()
  });

  return { simId: simRef.id };
});

export const onTournamentSimulationUpdated = onDocumentWritten({
  document: "tournament_simulations/{simId}",
  timeoutSeconds: 540
}, async (event) => {
  const db = getFirestore();
  const data = event.data?.after.data();
  const prevData = event.data?.before?.data();

  if (!data || data.status !== 'running') return;

  if (prevData && prevData.gamesCompletedInPhase === data.gamesCompletedInPhase && prevData.phase === data.phase && prevData.status === data.status) {
    return;
  }

  const { phase, gamesCompletedInPhase, totalGamesInPhase, gameType } = data;
  let bots = data.bots as any[];

  if (gamesCompletedInPhase >= totalGamesInPhase && totalGamesInPhase > 0) {
    if (phase === 1) {
      bots.sort((a, b) => b.wins - a.wins);
      const numToKeep = Math.floor(bots.length / 2);
      bots.forEach((bot, idx) => {
        if (idx >= numToKeep) bot.eliminated = true;
        if (!bot.eliminated) {
          bot.wins = 0;
          bot.gamesPlayed = 0;
        }
      });

      const remainingBots = bots.filter(b => !b.eliminated);
      const newTotalGames = remainingBots.length * 1000;

      return db.collection('tournament_simulations').doc(event.params.simId).update({
        phase: 2,
        gamesCompletedInPhase: 0,
        totalGamesInPhase: newTotalGames,
        bots
      });
    } else if (phase === 2) {
      return db.collection('tournament_simulations').doc(event.params.simId).update({ status: 'completed' });
    }
  }

  const activeBots = bots.filter(b => !b.eliminated);
  if (activeBots.length === 0) return;

  let game;
  try {
    game = getGame(gameType);
  } catch (err) {
    console.error(`Game ${gameType} not found in registry`);
    return;
  }

  const chunk = Math.min(CHUNK_SIZE, totalGamesInPhase - gamesCompletedInPhase);
  let gamesRun = 0;

  for (let i = 0; i < chunk; i++) {
    let bot;
    for (const b of activeBots) {
      if (b.gamesPlayed < 1000) { bot = b; break; }
    }
    if (!bot) break;

    let oppStrategy = '';

    if (phase === 1) {
      oppStrategy = (bot.gamesPlayed % 2 === 0) ? 'smart' : 'random';
    } else {
      let oppIdx = Math.floor(Math.random() * activeBots.length);
      while (activeBots[oppIdx].id === bot.id && activeBots.length > 1) {
        oppIdx = Math.floor(Math.random() * activeBots.length);
      }
      oppStrategy = activeBots[oppIdx].id;
    }

    // Randomize turn order to prevent player 1 advantage
    const isPlayer1 = Math.random() < 0.5;
    const pConfigs = isPlayer1 
      ? [{ id: bot.id, botStrategy: bot.id }, { id: oppStrategy, botStrategy: oppStrategy }]
      : [{ id: oppStrategy, botStrategy: oppStrategy }, { id: bot.id, botStrategy: bot.id }];

    coreRunSimulationBatch(game.reducer, game.initialState, pConfigs, 1, (res: any) => {
      bot.gamesPlayed++;
      
      if (res[0].winnerId === bot.id) {
        bot.wins++;
      }
    });
    gamesRun++;
  }

  if (gamesRun === 0) {
    return db.collection('tournament_simulations').doc(event.params.simId).update({ gamesCompletedInPhase: totalGamesInPhase });
  }

  return db.collection('tournament_simulations').doc(event.params.simId).update({
    gamesCompletedInPhase: gamesCompletedInPhase + gamesRun,
    bots
  });
});
