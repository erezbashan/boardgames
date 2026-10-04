import fs from 'fs';
import { dominionReducer as reducer } from '../src/engine/reducer';
import { DominionState } from '../src/engine/types';

const kingdomCards = ['smithy', 'village', 'festival', 'market', 'laboratory', 'workshop', 'mine', 'remodel', 'militia', 'moat'];

const createInitialState = (params1: any, params2: any, params3: any): DominionState => {
  return reducer({
    status: 'Lobby',
    players: {
      'bot1': { id: 'bot1', name: 'Bot 1', isBot: true, deck: [], hand: [], discard: [], playArea: [], actions: 1, buys: 1, coins: 0, victoryPoints: 0, transientDeckReveals: [] },
      'bot2': { id: 'bot2', name: 'Bot 2', isBot: true, deck: [], hand: [], discard: [], playArea: [], actions: 1, buys: 1, coins: 0, victoryPoints: 0, transientDeckReveals: [] },
      'bot3': { id: 'bot3', name: 'Bot 3', isBot: true, deck: [], hand: [], discard: [], playArea: [], actions: 1, buys: 1, coins: 0, victoryPoints: 0, transientDeckReveals: [] }
    },
    playerOrder: ['bot1', 'bot2', 'bot3'],
    currentPlayerIndex: 0,
    supply: {},
    trash: [],
    logs: [],
    pendingActions: [],
    phase: 'ACTION',
    settings: { kingdomCards, botParams: { bot1: params1, bot2: params2, bot3: params3 } },
    actionQueue: [],
    history: [],
    winnerId: null,
    chatMessages: []
  }, { type: 'START_GAME' } as any);
};

function runGame(params1: any, params2: any, params3: any): 'bot1' | 'bot2' | 'bot3' | 'tie' {
  let state = createInitialState(params1, params2, params3);
  let iterations = 0;
  while (state.status !== 'Finished' && iterations < 1500) {
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
  
  if (iterations >= 1500) {
    const p1 = state.players.bot1.victoryPoints;
    const p2 = state.players.bot2.victoryPoints;
    const p3 = state.players.bot3.victoryPoints;
    if (p1 > p2 && p1 > p3) return 'bot1';
    if (p2 > p1 && p2 > p3) return 'bot2';
    if (p3 > p1 && p3 > p2) return 'bot3';
    return 'tie';
  }
  
  if (!state.winnerId) return 'tie';
  return state.winnerId as 'bot1' | 'bot2' | 'bot3';
}

function playMatch(botA: any, botB: any, botC: any, hardCap: number = 30): any {
   let winsA = 0;
   let winsB = 0;
   let winsC = 0;
   let games = 0;
   
   // Permutations of play order: A-B-C, B-C-A, C-A-B
   while (games < hardCap) {
       let r = runGame(botA, botB, botC);
       if (r === 'bot1') winsA++; else if (r === 'bot2') winsB++; else if (r === 'bot3') winsC++;

       r = runGame(botB, botC, botA);
       if (r === 'bot1') winsB++; else if (r === 'bot2') winsC++; else if (r === 'bot3') winsA++;

       r = runGame(botC, botA, botB);
       if (r === 'bot1') winsC++; else if (r === 'bot2') winsA++; else if (r === 'bot3') winsB++;

       games += 3;
   }
   
   if (winsA >= winsB && winsA >= winsC) return botA;
   if (winsB >= winsA && winsB >= winsC) return botB;
   return botC;
}

function generateBots() {
  const bots = [];
  let idCounter = 1;
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
  console.log(`Starting 3-Player Tournament with ${pool.length} optimized bots...`);
  let round = 1;

  while (pool.length > 2) {
    console.log(`\n--- Round ${round} --- Pool size: ${pool.length}`);
    shuffle(pool);
    const nextPool = [];
    
    // Group in 3s
    for (let i = 0; i < pool.length; i += 3) {
      if (i + 2 < pool.length) {
        const winner = playMatch(pool[i], pool[i+1], pool[i+2], 6); // 2 sets of 3
        nextPool.push(winner);
      } else {
        // Less than 3 left, advance to next round or just add them
        nextPool.push(pool[i]);
        if (i + 1 < pool.length) nextPool.push(pool[i+1]);
      }
    }
    
    pool = nextPool;
    round++;
  }

  if (pool.length === 2) {
    console.log(`\n--- Final Round --- Pool size: 2`);
    // Run a 3P match with a dummy 3rd bot (just a random one from generateBots)
    const dummy = generateBots()[0];
    const finalWinner = playMatch(pool[0], pool[1], dummy, 6);
    pool = [finalWinner === dummy ? pool[0] : finalWinner];
  }

  console.log('\n==================================');
  console.log('🏆 3-PLAYER CHAMPION 🏆');
  console.log(JSON.stringify(pool[0], null, 2));
  console.log('==================================');
}

runTournament();
