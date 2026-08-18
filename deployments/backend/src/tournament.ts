import { onCall } from 'firebase-functions/v2/https';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { runSimulationBatch as coreRunSimulationBatch } from "@erez/boardgame-core/dist/engine/simulateGame";
import { getGame } from "@erez/boardgame-core";

const CHUNK_SIZE = 100;

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

import * as fs from 'fs';
import * as path from 'path';

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
      try {
        const resultsDir = path.join(__dirname, '../../../results');
        if (!fs.existsSync(resultsDir)) {
          fs.mkdirSync(resultsDir, { recursive: true });
        }
        
        let maxPhase = 0;
        bots.forEach((b: any) => {
          if (b.phaseStats) {
            Object.keys(b.phaseStats).forEach(p => {
              const ph = parseInt(p);
              if (ph > maxPhase) maxPhase = ph;
            });
          }
        });

        // Re-sort all bots like frontend
        const sortedBots = [...bots].sort((a,b) => {
          if (a.eliminated && !b.eliminated) return 1;
          if (!a.eliminated && b.eliminated) return -1;
          if (a.phaseStats && b.phaseStats) {
            const lastPhaseA = Math.max(...Object.keys(a.phaseStats).map(Number));
            const lastPhaseB = Math.max(...Object.keys(b.phaseStats).map(Number));
            if (lastPhaseA !== lastPhaseB) return lastPhaseB - lastPhaseA;
            return b.phaseStats[lastPhaseA].winRate - a.phaseStats[lastPhaseA].winRate;
          }
          return 0;
        });

        const headers = ['Rank', 'Status', 'VP', 'EN', 'HL', 'AT', 'YD', 'WinRate', 'GamesPlayed', 'AvgCardsBought'];
        for (let p = 1; p <= maxPhase; p++) headers.push(`P${p}%`);
        let csvContent = headers.join(',') + '\n';

        sortedBots.forEach((b, i) => {
          const currentWinRate = b.gamesPlayed > 0 ? (b.wins / b.gamesPlayed) * 100 : 0;
          const avgCards = b.gamesPlayed > 0 ? ((b.totalCardsBought || 0) / b.gamesPlayed).toFixed(2) : '0.00';
          const row = [
            i + 1,
            b.eliminated ? 'Eliminated' : 'Active',
            b.config?.vp || 0,
            b.config?.en || 0,
            b.config?.hl || 0,
            b.config?.at || 0,
            b.config?.yd || 0,
            `${currentWinRate.toFixed(1)}%`,
            b.gamesPlayed,
            avgCards
          ];
          for (let p = 1; p <= maxPhase; p++) {
            const stat = b.phaseStats && b.phaseStats[p];
            row.push(stat ? `${(stat.winRate * 100).toFixed(1)}%` : '-');
          }
          csvContent += row.join(',') + '\n';
        });

        const fileName = `tournament_${event.params.simId}.csv`;
        fs.writeFileSync(path.join(resultsDir, fileName), csvContent);
      } catch (e) {
        console.error('Failed to write CSV', e);
      }

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
      bot.totalCardsBought = (bot.totalCardsBought || 0) + (res[0].finalState?.players?.[bot.id]?.stats?.cardsBought || 0);
      
      if (oppBot) {
        oppBot.gamesPlayed++;
        oppBot.totalCardsBought = (oppBot.totalCardsBought || 0) + (res[0].finalState?.players?.[oppBot.id]?.stats?.cardsBought || 0);
      }
      
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
