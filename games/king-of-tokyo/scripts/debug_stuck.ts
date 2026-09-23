require.extensions['.css'] = () => {};
import { KotState } from '../src/engine/types';
import { kingOfTokyoReducer as reducer } from '../src/engine/reducer';

const initialState = reducer(undefined as any, { type: 'INIT_GAME', payload: { settings: { maxHealth: 10, maxVp: 20 } } });
let state = initialState;
state = reducer(state, { type: 'JOIN_GAME', payload: { playerId: `P1`, name: `P1_Exact`, isBot: true, botStrategy: 'exact' } });
state = reducer(state, { type: 'START_GAME', payload: {} });

let turnCount = 0;
while (state.status === 'Playing' && turnCount < 10) {
    turnCount++;
    console.log(`\n--- TURN ${turnCount} ---`);
    console.log("actionQueue before:", state.actionQueue?.length);
    state = reducer(state, { type: 'NOP', gameId: 'SIM', __isSimulation: true } as any);
    console.log("actionQueue after:", state.actionQueue?.length);
}
