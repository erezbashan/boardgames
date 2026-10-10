import { dominionReducer as reducer } from './src/engine/reducer';
import { DominionState } from './src/engine/types';
import { Cards } from './src/engine/cards';
import { getRandomBotAction } from './src/bot/randomBot';

const kingdomCards = [
  'village', 'smithy', 'militia', 'market', 'laboratory',
  'moat', 'chapel', 'witch', 'merchant', 'sentry'
];

const createInitialState = (params1: any, params2: any, firstPlayer: 'bot1' | 'bot2'): DominionState => {
  return reducer({
    status: 'Lobby', winnerId: null, chatMessages: [], history: [],
    players: {
      'bot1': { id: 'bot1', name: 'Bot 1', hand: [], deck: [], discard: [], playArea: [], actions: 1, buys: 1, coins: 0, victoryPoints: 0, isBot: true },
      'bot2': { id: 'bot2', name: 'Bot 2', hand: [], deck: [], discard: [], playArea: [], actions: 1, buys: 1, coins: 0, victoryPoints: 0, isBot: true }
    },
    playerOrder: firstPlayer === 'bot1' ? ['bot1', 'bot2'] : ['bot2', 'bot1'],
    currentPlayerIndex: 0, supply: {}, trash: [], logs: [], pendingActions: [], phase: 'ACTION',
    settings: { kingdomCards, botParams: { bot1: params1, bot2: params2 } }, actionQueue: []
  }, { type: 'START_GAME' } as any);
};

function runGame(params1: any, params2: any, firstPlayer: 'bot1' | 'bot2'): 'bot1' | 'bot2' | 'tie' {
  let state = createInitialState(params1, params2, firstPlayer);
  let iterations = 0;
  while (state.status !== 'Finished' && iterations < 3000) {
    iterations++;
    if (state.actionQueue && state.actionQueue.length > 0) {
      const act = state.actionQueue[0].action;
      state.actionQueue = state.actionQueue.slice(1);
      state = reducer(state, act as any);
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

function playMatch(botA: any, botB: any, numGames: number) {
   let winsA = 0; let winsB = 0;
   for (let i = 0; i < numGames; i++) {
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
for (let vInt = -20; vInt <= 0; vInt += 10) {
  for (let vSlp = 30; vSlp <= 70; vSlp += 15) {
    for (let mInt = -1; mInt <= 1; mInt += 1) {
       bots.push({ id: idCounter++, strategy: 'V1', vpIntercept: vInt, vpSlope: vSlp, moneyIntercept: mInt, moneySlope: 0, actionIntercept: 0.5, actionSlope: 0 });
    }
  }
}

console.log(`Starting Evolution bracket with ${bots.length} bots!`);
let currentPool = bots;
let round = 1;

while (currentPool.length > 1) {
  console.log(`--- Round ${round} --- Pool size: ${currentPool.length}`);
  const nextPool = [];
  const gamesPerMatch = currentPool.length <= 16 ? 50 : 10;
  
  for (let i=0; i < currentPool.length; i+=2) {
     if (i + 1 >= currentPool.length) {
        nextPool.push(currentPool[i]);
     } else {
        const winner = playMatch(currentPool[i], currentPool[i+1], gamesPerMatch);
        nextPool.push(winner);
     }
  }
  currentPool = nextPool;
  round++;
}

console.log("BEST V1 BOT PARAMS WITH NEW HEURISTICS:", currentPool[0]);
