require.extensions[".css"] = () => {};

import { dominionReducer as reducer } from '../src/engine/reducer';
import { DominionState } from '../src/engine/types';
import { generateInstanceId } from '../src/engine/utils';
import { Cards } from '../src/engine/cards';

const kingdomCards = Object.keys(Cards).filter(k => Cards[k].types.includes('ACTION')).slice(0, 10);

const createInitialState = (params: any): DominionState => {
  return reducer({
    status: 'Lobby',
    players: {
      'bot1': { id: 'bot1', name: 'Bot 1', hand: [], deck: [], discard: [], inPlay: [], setAside: [], actions: 1, buys: 1, coins: 0, victoryPoints: 0, isBot: true },
      'bot2': { id: 'bot2', name: 'Bot 2', hand: [], deck: [], discard: [], inPlay: [], setAside: [], actions: 1, buys: 1, coins: 0, victoryPoints: 0, isBot: true },
      'bot3': { id: 'bot3', name: 'Bot 3', hand: [], deck: [], discard: [], inPlay: [], setAside: [], actions: 1, buys: 1, coins: 0, victoryPoints: 0, isBot: true },
      'bot4': { id: 'bot4', name: 'Bot 4', hand: [], deck: [], discard: [], inPlay: [], setAside: [], actions: 1, buys: 1, coins: 0, victoryPoints: 0, isBot: true }
    },
    playerOrder: ['bot1', 'bot2', 'bot3', 'bot4'],
    currentPlayerIndex: 0,
    supply: {},
    trash: [],
    logs: [],
    pendingActions: [],
    turnPhase: 'ACTION',
    settings: { kingdomCards, botParams: params },
    actionQueue: []
  }, { type: 'START_GAME' } as any);
};

function runGame(params: any): string | null {
  let state = createInitialState(params);

  let iterations = 0;
  while (state.status !== 'Finished' && iterations < 5000) {
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

  return state.winnerId || null;
}

const paramsSet = [
  { name: 'Aggressive Early VP', vpIntercept: -5, vpSlope: 25, moneyIntercept: 1, moneySlope: -2, actionIntercept: 0, actionSlope: 0 },
  { name: 'Balanced', vpIntercept: -10, vpSlope: 30, moneyIntercept: 1, moneySlope: -1, actionIntercept: 0, actionSlope: 0 },
  { name: 'Big Money', vpIntercept: -15, vpSlope: 40, moneyIntercept: 2, moneySlope: -1, actionIntercept: -2, actionSlope: 0 },
  { name: 'Action Engine', vpIntercept: -10, vpSlope: 25, moneyIntercept: 0, moneySlope: 0, actionIntercept: 2, actionSlope: -1 }
];

console.log("Running bot tournaments (20 games each)...");
const results: any = {};

for (const p of paramsSet) {
  let wins = 0;
  for (let i = 0; i < 20; i++) {
    const winner = runGame(p);
    if (winner) wins++;
  }
  results[p.name] = wins;
  console.log(`- ${p.name}: ${wins} / 20 wins`);
}
console.log("Done!", results);
