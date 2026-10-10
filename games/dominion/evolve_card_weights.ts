import { dominionReducer as reducer } from './src/engine/reducer';
import { DominionState } from './src/engine/types';
import { getRandomBotAction } from './src/bot/randomBot';

const kingdomCards = [
  'village', 'smithy', 'militia', 'market', 'laboratory',
  'moat', 'chapel', 'witch', 'merchant', 'sentry'
];

// Helper to run a single game between two sets of weights
function runGame(weights1: Record<string, number>, weights2: Record<string, number>, firstPlayer: 'bot1' | 'bot2'): 'bot1' | 'bot2' | 'tie' {
  let state = reducer({
    status: 'Lobby', winnerId: null, chatMessages: [], history: [],
    players: {
      'bot1': { id: 'bot1', name: 'Bot 1', hand: [], deck: [], discard: [], playArea: [], actions: 1, buys: 1, coins: 0, victoryPoints: 0, isBot: true },
      'bot2': { id: 'bot2', name: 'Bot 2', hand: [], deck: [], discard: [], playArea: [], actions: 1, buys: 1, coins: 0, victoryPoints: 0, isBot: true }
    },
    playerOrder: firstPlayer === 'bot1' ? ['bot1', 'bot2'] : ['bot2', 'bot1'],
    currentPlayerIndex: 0, supply: {}, trash: [], logs: [], pendingActions: [], phase: 'ACTION',
    settings: { kingdomCards, botParams: { bot1: { strategy: 'V2', cardWeights: weights1 }, bot2: { strategy: 'V2', cardWeights: weights2 } } }, 
    actionQueue: []
  }, { type: 'START_GAME' } as any);
  
  let iterations = 0;
  while (state.status !== 'Finished' && iterations < 2000) {
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

function playMatch(w1: Record<string, number>, w2: Record<string, number>, numGames: number) {
   let winsA = 0, winsB = 0;
   for (let i = 0; i < numGames; i++) {
       const winner = runGame(w1, w2, i % 2 === 0 ? 'bot1' : 'bot2');
       if (winner === 'bot1') winsA++;
       else if (winner === 'bot2') winsB++;
       else { winsA+=0.5; winsB+=0.5; }
   }
   return { winsA, winsB };
}

function mutate(weights: Record<string, number>): Record<string, number> {
   const newW = { ...weights };
   // Pick 1-2 random cards to mutate
   const numMutations = 1 + Math.floor(Math.random() * 2);
   for (let i=0; i<numMutations; i++) {
      const card = kingdomCards[Math.floor(Math.random() * kingdomCards.length)];
      // Change by -2, -1, 1, or 2
      const delta = (Math.floor(Math.random() * 4) - 1.5) > 0 ? (Math.random() > 0.5 ? 1 : 2) : (Math.random() > 0.5 ? -1 : -2);
      newW[card] = (newW[card] || 0) + delta;
   }
   return newW;
}

async function runEvolution() {
   const POPULATION_SIZE = 20;
   const GENERATIONS = 50;
   const MATCHES = 20; // 20 games per pair
   
   let population = Array(POPULATION_SIZE).fill(0).map(() => {
      const w: Record<string, number> = {};
      kingdomCards.forEach(c => w[c] = 0);
      return w;
   });
   
   console.log("Starting Genetic Algorithm for Card Weights...");
   
   for (let gen = 1; gen <= GENERATIONS; gen++) {
      console.log(`\n=== GENERATION ${gen} ===`);
      // Score everyone against a baseline (all 0s) and against each other (random pairing)
      const scores = population.map(p => ({ weights: p, score: 0 }));
      
      for (let i=0; i<POPULATION_SIZE; i++) {
         // Play against baseline
         const baseMatch = playMatch(population[i], {}, MATCHES);
         scores[i].score += baseMatch.winsA;
      }
      
      scores.sort((a, b) => b.score - a.score);
      console.log(`Top bot score: ${scores[0].score}/${MATCHES}`);
      console.log(`Top bot weights:`, scores[0].weights);
      
      // Select top 5
      const top5 = scores.slice(0, 5).map(s => s.weights);
      
      // Breed next generation: Keep top 5, add 15 mutated children of top 5
      population = [...top5];
      for (let i = 0; i < 15; i++) {
         const parent = top5[Math.floor(Math.random() * top5.length)];
         population.push(mutate(parent));
      }
   }
}

runEvolution();
