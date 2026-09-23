require.extensions['.css'] = () => {};
import { KotState } from '../src/engine/types';
import { kingOfTokyoReducer as reducer } from '../src/engine/reducer';

const NUM_SIMS = 1000;

function createGame(numPlayers: number): KotState {
    const initialState = reducer(undefined as any, { type: 'INIT_GAME', payload: { settings: { maxHealth: 10, maxVp: 20 } } });
    let state = initialState;
    state = reducer(state, { type: 'JOIN_GAME', payload: { playerId: `P1`, name: `P1_Exact`, isBot: true, botStrategy: 'exact' } });
    for (let i = 2; i <= numPlayers; i++) {
        state = reducer(state, { type: 'JOIN_GAME', payload: { playerId: `P${i}`, name: `P${i}_Bucket`, isBot: true, botStrategy: 'bucket' } });
    }
    state = reducer(state, { type: 'START_GAME', payload: {} });
    state.market = []; state.deck = []; return state;
}

function simulateGame(initialState: KotState): string {
    let state = initialState;
    let turnCount = 0;
    while (state.status === 'Playing' && turnCount < 50000) {
        turnCount++;
        if (state.actionQueue && state.actionQueue.length > 0) {
            const nextQ = state.actionQueue[0];
            state = { ...state, actionQueue: state.actionQueue.slice(1) };
            state = reducer(state, { ...nextQ.action, gameId: 'SIM', __isSimulation: true } as any);
        } else {
            state = reducer(state, { type: 'NOP', gameId: 'SIM', __isSimulation: true } as any);
        }
    }
    const winners = Object.values(state.players).filter(p => p.health > 0);
    if (winners.length === 1) return winners[0].name.includes('Exact') ? 'Exact' : 'Bucket';
    if (winners.length > 1) {
        const vpWinners = winners.filter(p => p.vp >= 20);
        if (vpWinners.length > 0) return vpWinners[0].name.includes('Exact') ? 'Exact' : 'Bucket';
    }
    return 'Draw';
}

console.log("Tournament with Cards: ExactBot vs BucketBot");

for (let p = 2; p <= 6; p++) {
    let exactWins = 0;
    let bucketWins = 0;
    for (let i = 0; i < NUM_SIMS; i++) {
        const state = createGame(p);
        const winner = simulateGame(state);
        if (winner === 'Exact') exactWins++;
        else if (winner === 'Bucket') bucketWins++;
    }
    const exactWR = (exactWins / NUM_SIMS) * 100;
    const baselineWR = 100 / p;
    const overperformance = exactWR - baselineWR;
    console.log(`\n--- ${p}-PLAYER GAME (${NUM_SIMS} Sims) ---`);
    console.log(`ExactBot (P1) Win Rate:  ${exactWR.toFixed(1)}%`);
    console.log(`Expected (Fair):       ${baselineWR.toFixed(1)}%`);
    console.log(`ExactBot Edge:         ${overperformance > 0 ? '+' : ''}${overperformance.toFixed(1)}%`);
}
