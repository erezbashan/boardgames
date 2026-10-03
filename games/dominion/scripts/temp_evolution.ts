import fs from 'fs';
import { reducer } from '../src/engine/reducer';
import { DominionState, DominionSettings } from '../src/engine/types';
import { getCardDef } from '../src/engine/cards';
import { getRandomBotAction } from '../src/bot/randomBot';

const kingdomCards = ['smithy', 'village', 'festival', 'market', 'laboratory', 'workshop', 'mine', 'remodel', 'militia', 'moat'];

const generateInstanceId = (cardId: string) => `${cardId}_${Math.random().toString(36).substr(2, 9)}`;

const createInitialState = (params1: any, params2: any, firstPlayer: 'bot1' | 'bot2'): DominionState => {
  return reducer({
    status: 'Lobby',
    players: {
      'bot1': { id: 'bot1', name: 'Bot 1', deck: [], hand: [], discard: [], playArea: [], actions: 1, buys: 1, coins: 0, victoryPoints: 0, transientDeckReveals: [] },
      'bot2': { id: 'bot2', name: 'Bot 2', deck: [], hand: [], discard: [], playArea: [], actions: 1, buys: 1, coins: 0, victoryPoints: 0, transientDeckReveals: [] }
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
    console.log('Hit 500 iter limit!');
    fs.writeFileSync('stuck_state.json', JSON.stringify(state, null, 2));
    process.exit(1);
  }
  if (!state.winnerId) return 'tie';
  return state.winnerId as 'bot1' | 'bot2';
}

function playMatch(botA: any, botB: any, numGames: number): any {
   let winsA = 0;
   let winsB = 0;
   for (let i = 0; i < 4; i++) {
       const first = (i % 2 === 0) ? 'bot1' : 'bot2';
       const winner = runGame(botA, botB, first);
       if (winner === 'bot1') winsA++;
       else if (winner === 'bot2') winsB++;
       else { winsA += 0.5; winsB += 0.5; }
   }
   return winsA >= winsB ? botA : botB;
}

const bots = [];
let idCounter = 1;
for (let vInt = -20; vInt <= 0; vInt += 5) {
  for (let vSlp = 20; vSlp <= 40; vSlp += 10) {
    for (let mInt = -1; mInt <= 3; mInt += 1) {
      for (let mSlp = 0; mSlp <= 3; mSlp += 1) {
         bots.push({ id: idCounter++, vpIntercept: vInt, vpSlope: vSlp, moneyIntercept: mInt, moneySlope: mSlp, actionIntercept: 0, actionSlope: 0 });
      }
    }
  }
}

function shuffle(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

let pool = [...bots];
let round = 1;

while (pool.length > 1) {
   shuffle(pool);
   const nextPool = [];
   for (let i = 0; i < pool.length; i += 2) {
       if (i + 1 >= pool.length) {
           nextPool.push(pool[i]);
       } else {
           const winner = playMatch(pool[i], pool[i+1], 4);
           nextPool.push(winner);
       }
   }
   pool = nextPool;
   round++;
}

console.log('CHAMPION BOT:', pool[0]);
