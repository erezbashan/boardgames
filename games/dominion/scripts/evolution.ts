import { dominionReducer as reducer } from '../src/engine/reducer';
import { DominionState } from '../src/engine/types';
import { Cards } from '../src/engine/cards';

const kingdomCards = Object.keys(Cards).filter(k => Cards[k].types.includes('ACTION')).slice(0, 10);

const createInitialState = (params1: any, params2: any, firstPlayer: 'bot1' | 'bot2'): DominionState => {
  return reducer({
    status: 'Lobby',
    players: {
      'bot1': { id: 'bot1', name: 'Bot 1', hand: [], deck: [], discard: [], inPlay: [], setAside: [], actions: 1, buys: 1, coins: 0, victoryPoints: 0, isBot: true },
      'bot2': { id: 'bot2', name: 'Bot 2', hand: [], deck: [], discard: [], inPlay: [], setAside: [], actions: 1, buys: 1, coins: 0, victoryPoints: 0, isBot: true }
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
  if (iterations >= 500) console.log('Hit 500 iter limit!');
  if (!state.winnerId) return 'tie';
  return state.winnerId as 'bot1' | 'bot2';
}

function playMatch(botA: any, botB: any, numGames: number): any {
   let winsA = 0;
   let winsB = 0;
   for (let i=0; i<numGames; i++) {
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
for (let vInt = -20; vInt <= 20; vInt += 10) {
  for (let vSlp = 0; vSlp <= 40; vSlp += 10) {
    for (let mInt = -2; mInt <= 4; mInt += 2) {
      for (let mSlp = -4; mSlp <= 4; mSlp += 2) {
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
shuffle(bots);

console.log(`Starting Evolution bracket with ${bots.length} bots!`);
let currentPool = bots;
let round = 1;

while (currentPool.length > 1) {
  console.log(`--- Round ${round} --- Pool size: ${currentPool.length}`);
  const nextPool = [];
  const gamesPerMatch = currentPool.length <= 16 ? 50 : 6; // 6 games per match early on to go fast
  
  for (let i=0; i < currentPool.length; i+=2) {
     if (i % 100 === 0 && i > 0) console.log(`  Processed ${i/2}/${Math.ceil(currentPool.length/2)} matches...`);
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

console.log("CHAMPION BOT:", currentPool[0]);
