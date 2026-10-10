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
    status: 'Lobby',
    winnerId: null,
    chatMessages: [],
    history: [],
    players: {
      'bot1': { id: 'bot1', name: 'Bot 1 (V1)', hand: [], deck: [], discard: [], playArea: [], actions: 1, buys: 1, coins: 0, victoryPoints: 0, isBot: true },
      'bot2': { id: 'bot2', name: 'Bot 2 (V2)', hand: [], deck: [], discard: [], playArea: [], actions: 1, buys: 1, coins: 0, victoryPoints: 0, isBot: true }
    },
    playerOrder: firstPlayer === 'bot1' ? ['bot1', 'bot2'] : ['bot2', 'bot1'],
    currentPlayerIndex: 0,
    supply: {},
    trash: [],
    logs: [],
    pendingActions: [],
    phase: 'ACTION',
    settings: { kingdomCards, botParams: { bot1: params1, bot2: params2 } },
    actionQueue: []
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
    
    // Check if input is requested
    const isInputPhase = state.pendingActions.length > 0 && state.pendingActions[0].type === 'REQUEST_INPUT';
    const curPlayer = isInputPhase ? (state.pendingActions[0] as any).playerId : state.playerOrder[state.currentPlayerIndex];
    
    const botAction = getRandomBotAction(state, curPlayer);
    if (botAction) {
       state = reducer(state, botAction as any);
    } else {
       if (isInputPhase) {
          console.error("Bot stuck on input:", state.pendingActions[0]);
          break;
       }
       state = reducer(state, { type: 'END_PHASE', playerId: curPlayer } as any);
    }
  }
  
  if (iterations >= 3000) return 'tie';
  if (!state.winnerId) return 'tie';
  
  return state.winnerId as 'bot1' | 'bot2';
}

function playMatch(botA: any, botB: any, numGames: number) {
   let winsA = 0;
   let winsB = 0;
   let ties = 0;
   
   for (let i = 0; i < numGames; i++) {
       if (i % 10 === 0) console.log(`Played ${i}/${numGames}...`);
       const first = (i % 2 === 0) ? 'bot1' : 'bot2';
       const winner = runGame(botA, botB, first);
       if (winner === 'bot1') winsA++;
       else if (winner === 'bot2') winsB++;
       else ties++;
   }
   return { winsA, winsB, ties };
}

// Bot V1 uses the previously discovered optimal params
const botV1 = { vpIntercept: 0, vpSlope: 15, moneyIntercept: 1, moneySlope: 0, actionIntercept: 0.5, actionSlope: 0 };
// Bot V2 uses the new hardcoded heuristics
const botV2 = { strategy: 'V2' };

console.log("Running 100 game tournament: Bot V1 (Curves) vs Bot V2 (Big Money)");
const results = playMatch(botV1, botV2, 100);

console.log(`\nTournament Results:`);
console.log(`Bot V1 (Curves) Wins: ${results.winsA}`);
console.log(`Bot V2 (Big Money) Wins: ${results.winsB}`);
console.log(`Ties: ${results.ties}`);
console.log(`\nBot V2 Win Rate: ${((results.winsB / (results.winsA + results.winsB)) * 100).toFixed(1)}%`);
