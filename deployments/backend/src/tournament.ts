import { onCall } from 'firebase-functions/v2/https';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { runSimulationBatch as coreRunSimulationBatch } from "@erez/boardgame-core/dist/engine/simulateGame";
import { getGame } from "@erez/boardgame-core";

import * as fs from 'fs';
import * as path from 'path';

export const listTournamentResults = onCall(async () => {
  const resultsDir = path.join(__dirname, '../../../results');
  if (!fs.existsSync(resultsDir)) return { files: [] };
  const files = fs.readdirSync(resultsDir).filter(f => f.endsWith('.csv'));
  return { files };
});

const CHUNK_SIZE = 100;

export const startTournament = onCall(async (request) => {
  const { gameType, bots: inputBots, gamesPerPhase: inputGames, startingPlayers = 2, fallbacks = {} } = request.data;
  const db = getFirestore();

  if (!inputBots || !Array.isArray(inputBots)) {
    throw new Error('Bots array is required to start a tournament.');
  }

  // Load fallback strings if any
  const fallbackStrings: Record<number, string[]> = {};
  const resultsDir = path.join(__dirname, '../../../results');
  
  if (fallbacks && Object.keys(fallbacks).length > 0) {
    for (const [playersLeft, fallbackConfig] of Object.entries(fallbacks)) {
      const pLeft = parseInt(playersLeft);
      const conf: any = fallbackConfig; // { file: string, topX: number }
      
      const filePath = path.join(resultsDir, conf.file);
      if (fs.existsSync(filePath)) {
        const lines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);
        // Find header index
        let headerIdx = 0;
        while (headerIdx < lines.length && lines[headerIdx].startsWith('#')) {
          headerIdx++;
        }
        
        // Skip header and column names
        const dataLines = lines.slice(headerIdx + 1);
        const topStrats: string[] = [];
        
        for (let i = 0; i < Math.min(conf.topX, dataLines.length); i++) {
          const cols = dataLines[i].split(',');
          // Rank, Status, VP, EN, HL, AT, YD
          if (cols.length >= 7) {
            topStrats.push(`VP:${cols[2]} EN:${cols[3]} HL:${cols[4]} AT:${cols[5]} YD:${cols[6]}`);
          }
        }
        fallbackStrings[pLeft] = topStrats;
      }
    }
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
    startingPlayers,
    fallbackStrings,
    fallbacksConfig: fallbacks,
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
        
        const startingPlayers = data.startingPlayers || 2;
        let csvContent = `# Tournament Config: startingPlayers=${startingPlayers}, gamesPerPhase=${gamesPerPhase}\n`;
        if (data.fallbacksConfig) {
          csvContent += `# Fallbacks: ${JSON.stringify(data.fallbacksConfig)}\n`;
        }
        csvContent += headers.join(',') + '\n';

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

    const startingPlayers = data.startingPlayers || 2;
    const oppBots: any[] = [];
    const oppStrategies: string[] = [];

    if (phase === 1) {
      for (let p = 1; p < startingPlayers; p++) {
        oppStrategies.push((bot.gamesPlayed + p) % 2 === 0 ? 'smart' : 'random');
      }
    } else {
      const candidates = activeBots.slice(1, Math.min(20, activeBots.length));
      for (let p = 1; p < startingPlayers; p++) {
        const oppBot = candidates[Math.floor(Math.random() * candidates.length)];
        if (oppBot) {
          oppBots.push(oppBot);
          oppStrategies.push(oppBot.id);
        }
      }
    }

    if (oppStrategies.length < startingPlayers - 1) break;

    const getBotStrategyString = (baseId: string) => {
       if (baseId === 'smart' || baseId === 'random') return baseId;
       let str = baseId;
       if (data.fallbackStrings) {
         for (const [pLeft, strats] of Object.entries(data.fallbackStrings)) {
            const arr = strats as string[];
            if (arr && arr.length > 0) {
              const randomStrat = arr[Math.floor(Math.random() * arr.length)];
              str += ` | ${pLeft}P:${randomStrat}`;
            }
         }
       }
       return str;
    };

    const pConfigs = [];
    const allIds = [bot.id, ...oppStrategies];
    // Shuffle positions
    allIds.sort(() => Math.random() - 0.5);
    
    for (const id of allIds) {
      // Ensure unique IDs in pConfigs if multiple random/smart bots exist
      let suffix = '';
      if (id === 'smart' || id === 'random') {
         suffix = '_' + Math.floor(Math.random() * 1000);
      }
      pConfigs.push({ id: id + suffix, botStrategy: getBotStrategyString(id), originalId: id });
    }

    coreRunSimulationBatch(game.reducer, game.initialState, pConfigs, 1, (res: any) => {
      bot.gamesPlayed++;
      bot.totalCardsBought = (bot.totalCardsBought || 0) + (res[0].finalState?.players?.[bot.id]?.stats?.cardsBought || 0);
      
      oppBots.forEach(oppBot => {
        oppBot.gamesPlayed++;
        oppBot.totalCardsBought = (oppBot.totalCardsBought || 0) + (res[0].finalState?.players?.[oppBot.id]?.stats?.cardsBought || 0);
      });
      
      const winnerOriginalId = pConfigs.find(p => p.id === res[0].winnerId)?.originalId;
      if (winnerOriginalId === bot.id) {
        bot.wins++;
      } else {
        const winningOpp = oppBots.find(o => o.id === winnerOriginalId);
        if (winningOpp) winningOpp.wins++;
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
