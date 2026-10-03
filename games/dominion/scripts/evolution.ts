import fs from 'fs';
import { dominionReducer as reducer } from '../src/engine/reducer';
import { DominionState } from '../src/engine/types';

const kingdomCards = ['smithy', 'village', 'festival', 'market', 'laboratory', 'workshop', 'mine', 'remodel', 'militia', 'moat'];

const createInitialState = (params1: any, params2: any, firstPlayer: 'bot1' | 'bot2'): DominionState => {
  return reducer({
    status: 'Lobby',
    players: {
      'bot1': { id: 'bot1', name: 'Bot 1', isBot: true, deck: [], hand: [], discard: [], playArea: [], actions: 1, buys: 1, coins: 0, victoryPoints: 0, transientDeckReveals: [] },
      'bot2': { id: 'bot2', name: 'Bot 2', isBot: true, deck: [], hand: [], discard: [], playArea: [], actions: 1, buys: 1, coins: 0, victoryPoints: 0, transientDeckReveals: [] }
    },
    playerOrder: firstPlayer === 'bot1' ? ['bot1', 'bot2'] : ['bot2', 'bot1'],
    currentPlayerIndex: 0,
    supply: {},
    trash: [],
    logs: [],
    pendingActions: [],
    turnPhase: 'ACTION',
    settings: { kingdomCards, botParams: { bot1: params1, bot2: params2 } },
    actionQueue: []
  }, { type: 'START_GAME' } as any);
};

function runGame(params1: any, params2: any, firstPlayer: 'bot1' | 'bot2'): 'bot1' | 'bot2' | 'tie' {
  let state = createInitialState(params1, params2, firstPlayer);
  let iterations = 0;
  while (state.status !== 'Finished' && iterations < 500) {
    iterations++;
    if (state.actionQueue && state.actionQueue.length > 0) {
      const act = state.actionQueue[0].action;
      state.actionQueue = state.actionQueue.slice(1);
      state = reducer(state, act as any);
      continue;
    }
    const curPlayer = state.playerOrder[state.currentPlayerIndex];
    state = reducer(state, { type: 'PLAY_BOT', playerId: curPlayer } as any);
  }
  
  if (iterations >= 500) {
    // If it stalls, we look at VP
    const p1 = state.players.bot1.victoryPoints;
    const p2 = state.players.bot2.victoryPoints;
    if (p1 > p2) return 'bot1';
    if (p2 > p1) return 'bot2';
    return 'tie';
  }
  
  if (!state.winnerId) return 'tie';
  return state.winnerId as 'bot1' | 'bot2';
}

function playMatch(botA: any, botB: any, hardCap: number = 30): any {
   let winsA = 0;
   let winsB = 0;
   let games = 0;
   
   // We play in pairs to ensure fairness (each goes first exactly once per pair)
   while (games < hardCap) {
       // Game 1: botA goes first
       const res1 = runGame(botA, botB, 'bot1');
       if (res1 === 'bot1') winsA++;
       else if (res1 === 'bot2') winsB++;
       else { winsA += 0.5; winsB += 0.5; }
       
       // Game 2: botB goes first
       const res2 = runGame(botA, botB, 'bot2');
       if (res2 === 'bot1') winsA++;
       else if (res2 === 'bot2') winsB++;
       else { winsA += 0.5; winsB += 0.5; }
       
       games += 2;
       
       // Calculate Z-Score for statistical significance (Null Hypothesis: p = 0.5)
       // Z = (W - (N / 2)) / sqrt(N / 4)
       if (games >= 6) { // Minimum sample size before checking
         const expected = games / 2;
         const stdDev = Math.sqrt(games / 4);
         const zScore = Math.abs(winsA - expected) / stdDev;
         
         // Z = 1.96 corresponds to p < 0.05 (95% confidence)
         if (zScore >= 1.96) {
           break; // Statistically significant winner found!
         }
       }
   }
   
   if (winsA > winsB) return botA;
   if (winsB > winsA) return botB;
   return Math.random() > 0.5 ? botA : botB; // Pure tie at hard cap
}

function generateBots() {
  const bots = [];
  let idCounter = 1;
  // Pruned grid: 64 combinations
  for (let vInt of [-20, -10, -5, 0]) {
    for (let vSlp of [15, 25, 35, 45]) {
      for (let mInt of [0, 1]) {
        for (let mSlp of [0, 1]) {
          bots.push({
            id: idCounter++,
            vpIntercept: vInt,
            vpSlope: vSlp,
            moneyIntercept: mInt,
            moneySlope: mSlp,
            actionIntercept: 0.5,
            actionSlope: 0
          });
        }
      }
    }
  }
  return bots;
}

function shuffle(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

async function runTournament() {
  let pool = generateBots();
  console.log(`Starting Statistically Significant 1v1 Tournament with ${pool.length} optimized bots...`);
  let round = 1;

  while (pool.length > 1) {
    console.log(`\n--- Round ${round} --- Pool size: ${pool.length}`);
    shuffle(pool);
    const nextPool = [];
    
    for (let i = 0; i < pool.length; i += 2) {
      if (i + 1 >= pool.length) {
        nextPool.push(pool[i]);
      } else {
        const winner = playMatch(pool[i], pool[i+1], 40); // Hard cap of 40 games
        nextPool.push(winner);
      }
    }
    
    pool = nextPool;
    round++;
  }

  console.log('\n==================================');
  console.log('🏆 TRUE STATISTICAL CHAMPION 🏆');
  console.log(JSON.stringify(pool[0], null, 2));
  console.log('==================================');
}

runTournament();
