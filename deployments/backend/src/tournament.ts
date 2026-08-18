import { onCall } from 'firebase-functions/v2/https';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { runSimulationBatch as coreRunSimulationBatch } from "@erez/boardgame-core/dist/engine/simulateGame";
import { getGame } from "@erez/boardgame-core";

const CHUNK_SIZE = 1000;

export const startTournament = onCall(async (request) => {
  const { gameType, bots: inputBots, gamesPerPhase: inputGames } = request.data;
  const db = getFirestore();

  if (!inputBots || !Array.isArray(inputBots)) {
    throw new Error('Bots array is required to start a tournament.');
  }

  const bots = inputBots.map((b: any) => ({
    id: b.id,
    config: b.config,
    wins: 0,
    gamesPlayed: 0,
    eliminated: false,
    phaseStats: {}
  }));

  const gamesPerPhase = inputGames || 100;
  const totalGamesInPhase = bots.length * gamesPerPhase;

  const simRef = db.collection('tournament_simulations').doc();
  await simRef.set({
    status: 'running',
    gameType: gameType || 'king-of-tokyo',
    phase: 1,
    gamesCompletedInPhase: 0,
    totalGamesInPhase,
    gamesPerPhase,
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

  const { phase, gamesCompletedInPhase, totalGamesInPhase, gameType, gamesPerPhase = 1000 } = data;
  let bots = data.bots as any[];

  if (gamesCompletedInPhase >= totalGamesInPhase && totalGamesInPhase > 0) {
    const activeBots = bots.filter(b => !b.eliminated);
    
    // Save phase stats
    activeBots.forEach(bot => {
      const winRate = bot.gamesPlayed > 0 ? bot.wins / bot.gamesPlayed : 0;
      if (!bot.phaseStats) bot.phaseStats = {};
      bot.phaseStats[phase] = { wins: bot.wins, gamesPlayed: bot.gamesPlayed, winRate };
    });

    // Sort by win rate descending
    activeBots.sort((a, b) => b.phaseStats[phase].winRate - a.phaseStats[phase].winRate);
    
    // Eliminate bottom half
    const numToKeep = Math.floor(activeBots.length / 2);
    activeBots.forEach((bot, idx) => {
      if (idx >= numToKeep) bot.eliminated = true;
      if (!bot.eliminated) {
        bot.wins = 0;
        bot.gamesPlayed = 0;
      }
    });

    const remainingBots = activeBots.filter(b => !b.eliminated);
    
    if (remainingBots.length <= 1) {
      return db.collection('tournament_simulations').doc(event.params.simId).update({ 
        status: 'completed',
        bots 
      });
    } else {
      const nextPhase = phase + 1;
      const newTotalGames = (remainingBots.length * gamesPerPhase) / 2; // internal matches

      return db.collection('tournament_simulations').doc(event.params.simId).update({
        phase: nextPhase,
        gamesCompletedInPhase: 0,
        totalGamesInPhase: newTotalGames,
        bots
      });
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
    activeBots.sort((a, b) => a.gamesPlayed - b.gamesPlayed);
    let bot = activeBots[0];
    
    if (bot.gamesPlayed >= gamesPerPhase) break;

    let oppStrategy = '';
    let oppBot: any = null;

    if (phase === 1) {
      oppStrategy = (bot.gamesPlayed % 2 === 0) ? 'smart' : 'random';
    } else {
      const candidates = activeBots.slice(1, Math.min(6, activeBots.length));
      oppBot = candidates[Math.floor(Math.random() * candidates.length)];
      if (!oppBot) break;
      oppStrategy = oppBot.id;
    }

    const isPlayer1 = Math.random() < 0.5;
    const pConfigs = isPlayer1 
      ? [{ id: bot.id, botStrategy: bot.id }, { id: oppStrategy, botStrategy: oppStrategy }]
      : [{ id: oppStrategy, botStrategy: oppStrategy }, { id: bot.id, botStrategy: bot.id }];

    coreRunSimulationBatch(game.reducer, game.initialState, pConfigs, 1, (res: any) => {
      bot.gamesPlayed++;
      if (oppBot) oppBot.gamesPlayed++;
      
      if (res[0].winnerId === bot.id) {
        bot.wins++;
      } else if (oppBot && res[0].winnerId === oppBot.id) {
        oppBot.wins++;
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
