import { dominionReducer as reducer } from '../src/engine/reducer';
import { DominionState } from '../src/engine/types';

const kingdomCards = ['smithy', 'village', 'festival', 'market', 'laboratory', 'workshop', 'mine', 'remodel', 'militia', 'moat'];

const createInitialState = (params1: any, params2: any, firstPlayer: 'bot1' | 'bot2'): DominionState => {
  return reducer({
    status: 'Lobby',
    players: {
      'bot1': { id: 'bot1', name: 'Bot A (Champion)', isBot: true, deck: [], hand: [], discard: [], playArea: [], actions: 1, buys: 1, coins: 0, victoryPoints: 0, transientDeckReveals: [] },
      'bot2': { id: 'bot2', name: 'Bot B (Equal)', isBot: true, deck: [], hand: [], discard: [], playArea: [], actions: 1, buys: 1, coins: 0, victoryPoints: 0, transientDeckReveals: [] }
    },
    playerOrder: firstPlayer === 'bot1' ? ['bot1', 'bot2'] : ['bot2', 'bot1'],
    currentPlayerIndex: 0,
    supply: {},
    trash: [],
    logs: [],
    pendingActions: [],
    phase: 'ACTION',
    settings: { kingdomCards, botParams: { bot1: params1, bot2: params2 } },
    actionQueue: [],
    history: [],
    winnerId: null,
    chatMessages: []
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
    const p1 = state.players.bot1.victoryPoints;
    const p2 = state.players.bot2.victoryPoints;
    if (p1 > p2) return 'bot1';
    if (p2 > p1) return 'bot2';
    return 'tie';
  }
  
  if (!state.winnerId) return 'tie';
  return state.winnerId as 'bot1' | 'bot2';
}

const botA = { vpIntercept: 0, vpSlope: 15, moneyIntercept: 1, moneySlope: 0, actionIntercept: 0.5, actionSlope: 0 };
const botB = { vpIntercept: 0, vpSlope: 15, moneyIntercept: 0.5, moneySlope: 0, actionIntercept: 0.5, actionSlope: 0 };

let winsA = 0;
let winsB = 0;
let ties = 0;

console.log('Running 1000 games...');
for (let i = 0; i < 500; i++) {
    let res1 = runGame(botA, botB, 'bot1');
    if (res1 === 'bot1') winsA++; else if (res1 === 'bot2') winsB++; else ties++;
    
    let res2 = runGame(botA, botB, 'bot2');
    if (res2 === 'bot1') winsA++; else if (res2 === 'bot2') winsB++; else ties++;
    
    if ((i + 1) % 100 === 0) {
        console.log(`Progress: ${(i + 1) * 2} games... (A: ${winsA}, B: ${winsB}, Ties: ${ties})`);
    }
}

console.log('\n--- FINAL RESULTS ---');
console.log(`Bot A (Champion, +1.0 Money) Wins: ${winsA} (${((winsA/1000)*100).toFixed(1)}%)`);
console.log(`Bot B (Equal, +0.5 Money)    Wins: ${winsB} (${((winsB/1000)*100).toFixed(1)}%)`);
console.log(`Ties: ${ties} (${((ties/1000)*100).toFixed(1)}%)`);
