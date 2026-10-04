import { dominionReducer as reducer } from '../src/engine/reducer';
import { DominionState } from '../src/engine/types';

const kingdomCards = ['smithy', 'village', 'festival', 'market', 'laboratory', 'workshop', 'mine', 'remodel', 'militia', 'moat'];

const PROFILES = [
  { id: 'Bot_1v1_Champ', vpIntercept: 0, vpSlope: 15, moneyIntercept: 1, moneySlope: 0, actionIntercept: 0.5, actionSlope: 0 },
  { id: 'Bot_3P_Champ', vpIntercept: -20, vpSlope: 45, moneyIntercept: 1, moneySlope: 0, actionIntercept: 0.5, actionSlope: 0 },
  { id: 'Bot_Med_Panic', vpIntercept: -10, vpSlope: 30, moneyIntercept: 1, moneySlope: 0, actionIntercept: 0.5, actionSlope: 0 },
  { id: 'Bot_Extreme_Panic', vpIntercept: -40, vpSlope: 60, moneyIntercept: 1, moneySlope: 0, actionIntercept: 0.5, actionSlope: 0 },
  { id: 'Bot_Hyper_Extreme', vpIntercept: -50, vpSlope: 80, moneyIntercept: 1, moneySlope: 0, actionIntercept: 0.5, actionSlope: 0 },
  { id: 'Bot_Base_Default', vpIntercept: 0, vpSlope: 20, moneyIntercept: -1, moneySlope: 1, actionIntercept: 0, actionSlope: 0 }
];

function runFFA(numPlayers: number, numGames: number) {
  let wins: Record<string, number> = {};
  for (let i=0; i<numPlayers; i++) wins[PROFILES[i].id] = 0;

  for (let g = 0; g < numGames; g++) {
    // Rotate seating order based on game index
    const playersObj: any = {};
    const order: string[] = [];
    const botParams: any = {};
    
    for (let i = 0; i < numPlayers; i++) {
       const profile = PROFILES[i];
       const pId = profile.id;
       playersObj[pId] = { id: pId, name: pId, isBot: true, deck: [], hand: [], discard: [], playArea: [], actions: 1, buys: 1, coins: 0, victoryPoints: 0, transientDeckReveals: [] };
       botParams[pId] = profile;
    }
    
    // Shift the order so everyone gets a turn going first
    for(let i = 0; i < numPlayers; i++) {
       order.push(PROFILES[(g + i) % numPlayers].id);
    }

    let state = reducer({
      status: 'Lobby',
      players: playersObj,
      playerOrder: order,
      currentPlayerIndex: 0,
      supply: {},
      trash: [],
      logs: [],
      pendingActions: [],
      phase: 'ACTION',
      settings: { kingdomCards, botParams },
      actionQueue: [],
      history: [],
      winnerId: null,
      chatMessages: []
    } as any, { type: 'START_GAME' } as any);

    let iterations = 0;
    while (state.status !== 'Finished' && iterations < 2000) {
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
    
    if (state.winnerId) {
       wins[state.winnerId] = (wins[state.winnerId] || 0) + 1;
    } else {
       // tiebreaker by VP
       let maxVP = -999;
       let bestP = '';
       for(let i=0; i<numPlayers; i++) {
          const p = state.players[PROFILES[i].id];
          if (p.victoryPoints > maxVP) { maxVP = p.victoryPoints; bestP = p.id; }
       }
       if (bestP) wins[bestP] = (wins[bestP] || 0) + 1;
    }
  }

  return wins;
}

console.log('--- Running 4-Player FFA (400 games) ---');
const w4 = runFFA(4, 400);
console.log(w4);

console.log('\n--- Running 5-Player FFA (500 games) ---');
const w5 = runFFA(5, 500);
console.log(w5);

console.log('\n--- Running 6-Player FFA (600 games) ---');
const w6 = runFFA(6, 600);
console.log(w6);
