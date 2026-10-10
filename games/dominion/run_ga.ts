import { dominionReducer as reducer } from './src/engine/reducer';
import { DominionState } from './src/engine/types';
import { Cards } from './src/engine/cards';
import { getRandomBotAction } from './src/bot/randomBot';
import fs from 'fs';

const ALL_CARDS = Object.keys(Cards);
const BASE_CARDS = ['copper', 'silver', 'gold', 'estate', 'duchy', 'province', 'curse'];
const ACTION_CARDS = ALL_CARDS.filter(c => !BASE_CARDS.includes(c));

interface BotGenome {
   cardWeights: Record<string, number>;
   linear: {
       provInt: number; provSlp: number;
       duchyInt: number; duchySlp: number;
       estInt: number; estSlp: number;
       goldInt: number; goldSlp: number;
       silvInt: number; silvSlp: number;
   };
}

function createInitialState(genome1: BotGenome, genome2: BotGenome, firstPlayer: 'bot1' | 'bot2'): DominionState {
  return reducer({
    status: 'Lobby', winnerId: null, chatMessages: [], history: [],
    players: {
      'bot1': { id: 'bot1', name: 'Bot 1', hand: [], deck: [], discard: [], playArea: [], actions: 1, buys: 1, coins: 0, victoryPoints: 0, isBot: true },
      'bot2': { id: 'bot2', name: 'Bot 2', hand: [], deck: [], discard: [], playArea: [], actions: 1, buys: 1, coins: 0, victoryPoints: 0, isBot: true }
    },
    playerOrder: firstPlayer === 'bot1' ? ['bot1', 'bot2'] : ['bot2', 'bot1'],
    currentPlayerIndex: 0, supply: {}, trash: [], logs: [], pendingActions: [], phase: 'ACTION',
    settings: { 
       botParams: { 
         bot1: { strategy: 'GA_V3', ...genome1 }, 
         bot2: { strategy: 'GA_V3', ...genome2 } 
       } 
    }, 
    actionQueue: []
  }, { type: 'START_GAME' } as any);
}

function runGame(g1: BotGenome, g2: BotGenome, firstPlayer: 'bot1' | 'bot2'): 'bot1' | 'bot2' | 'tie' {
  let state = createInitialState(g1, g2, firstPlayer);
  let iterations = 0;
  while (state.status !== 'Finished' && iterations < 3000) {
    iterations++;
    if (state.actionQueue && state.actionQueue.length > 0) {
      state = reducer(state, state.actionQueue[0].action as any);
      state.actionQueue = state.actionQueue.slice(1);
      continue;
    }
    const isInputPhase = state.pendingActions.length > 0 && state.pendingActions[0].type === 'REQUEST_INPUT';
    const curPlayer = isInputPhase ? (state.pendingActions[0] as any).playerId : state.playerOrder[state.currentPlayerIndex];
    const botAction = getRandomBotAction(state, curPlayer);
    if (botAction) state = reducer(state, botAction as any);
    else state = reducer(state, { type: 'END_PHASE', playerId: curPlayer } as any);
  }
  return state.winnerId as 'bot1' | 'bot2' || 'tie';
}

function playMatch(g1: BotGenome, g2: BotGenome, numGames: number) {
   let winsA = 0, winsB = 0;
   for (let i = 0; i < numGames; i++) {
       const winner = runGame(g1, g2, i % 2 === 0 ? 'bot1' : 'bot2');
       if (winner === 'bot1') winsA++;
       else if (winner === 'bot2') winsB++;
       else { winsA+=0.5; winsB+=0.5; }
   }
   return { winsA, winsB };
}

function randomGenome(): BotGenome {
    const w: Record<string, number> = {};
    ACTION_CARDS.forEach(c => w[c] = Math.floor(Math.random() * 11) - 5); // -5 to +5
    return {
        cardWeights: w,
        linear: {
            provInt: Math.floor(Math.random() * 41) - 20, // -20 to 20
            provSlp: Math.floor(Math.random() * 101), // 0 to 100
            duchyInt: Math.floor(Math.random() * 41) - 20,
            duchySlp: Math.floor(Math.random() * 51), // 0 to 50
            estInt: Math.floor(Math.random() * 21) - 10,
            estSlp: Math.floor(Math.random() * 21), // 0 to 20
            goldInt: Math.floor(Math.random() * 21), // 0 to 20
            goldSlp: Math.floor(Math.random() * 21) - 10, // -10 to 10
            silvInt: Math.floor(Math.random() * 11), // 0 to 10
            silvSlp: Math.floor(Math.random() * 21) - 10,
        }
    };
}

function mutate(g: BotGenome): BotGenome {
   const newW = { ...g.cardWeights };
   const newL = { ...g.linear };
   
   // Mutate 1-3 random card weights
   const numMutations = 1 + Math.floor(Math.random() * 3);
   for (let i=0; i<numMutations; i++) {
      const card = ACTION_CARDS[Math.floor(Math.random() * ACTION_CARDS.length)];
      newW[card] += (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 2) + 1);
   }
   
   // 50% chance to mutate a linear param
   if (Math.random() > 0.5) {
       const keys = Object.keys(newL) as (keyof typeof newL)[];
       const key = keys[Math.floor(Math.random() * keys.length)];
       newL[key] += (Math.random() > 0.5 ? 2 : -2) * (Math.floor(Math.random() * 5) + 1);
   }
   
   return { cardWeights: newW, linear: newL };
}

async function runEvolution() {
   const POPULATION_SIZE = 20;
   const GENERATIONS = 100;
   const MATCHES = 500; // 20 games against baseline per gen
   
   let population = Array(POPULATION_SIZE).fill(0).map(randomGenome);
   
   // Let's seed population[0] with a known strong heuristic (roughly emulating V2)
   population[0] = {
       cardWeights: {},
       linear: { provInt: -40, provSlp: 100, duchyInt: -20, duchySlp: 40, estInt: -10, estSlp: 10, goldInt: 10, goldSlp: 0, silvInt: 5, silvSlp: 0 }
   };
   
   const logStream = fs.createWriteStream('../../results/ga_v3_progress.log');
   const log = (msg: string) => { console.log(msg); logStream.write(msg + '\n'); };
   
   log("Starting Full Genetic Algorithm for Cards and Linear Parameters...");
   
   let bestOverallScore = 0;
   let bestOverallGenome: BotGenome | null = null;
   let stalledGens = 0;
   
   for (let gen = 1; gen <= GENERATIONS; gen++) {
      log(`\n=== GENERATION ${gen} ===`);
      
      const scores = population.map(p => ({ genome: p, score: 0 }));
      
      // Play a round-robin tournament slice (each bot plays against 2 random opponents, 10 games each)
      // Actually simpler: each plays against the best of previous generation (or population[0] for gen1)
      const baseline = bestOverallGenome || population[0];
      
      for (let i=0; i<POPULATION_SIZE; i++) {
         const match = playMatch(population[i], baseline, MATCHES);
         scores[i].score = match.winsA; // how many it won against baseline
      }
      
      scores.sort((a, b) => b.score - a.score);
      const topScore = scores[0].score;
      log(`Top bot score against baseline: ${topScore}/${MATCHES}`);
      
      if (topScore > bestOverallScore || (bestOverallGenome === null)) {
          bestOverallScore = topScore;
          bestOverallGenome = scores[0].genome;
          stalledGens = 0;
          log(`New best genome found!`);
      } else {
          stalledGens++;
      }
      
      log(`Top genome weights: ${JSON.stringify(scores[0].genome.cardWeights)}`);
      log(`Top genome linear: ${JSON.stringify(scores[0].genome.linear)}`);
      
      if (stalledGens >= 15) {
          log(`\nStopping early: No improvement in 15 generations.`);
          break;
      }
      
      // Select top 5
      const top5 = scores.slice(0, 5).map(s => s.genome);
      
      // Breed next generation
      population = [...top5]; // keep the elite
      population.push(bestOverallGenome); // always keep the all-time best
      
      while (population.length < POPULATION_SIZE) {
         const parent = top5[Math.floor(Math.random() * top5.length)];
         population.push(mutate(parent));
      }
   }
   
   log("\n=== EVOLUTION COMPLETE ===");
   log(`Final Best Linear Params: ${JSON.stringify(bestOverallGenome?.linear)}`);
   log(`Final Best Card Weights: ${JSON.stringify(bestOverallGenome?.cardWeights)}`);
   logStream.end();
}

runEvolution();
