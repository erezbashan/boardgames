require.extensions['.css'] = () => {};
import { KotState } from '../src/engine/types';
import { kingOfTokyoReducer as reducer } from '../src/engine/reducer';
let state = reducer(undefined as any, { type: 'INIT_GAME', payload: { settings: { maxHealth: 10, maxVp: 20 } } });
state = reducer(state, { type: 'JOIN_GAME', payload: { playerId: `P1`, name: `P1`, isBot: true, botStrategy: 'bucket' } });
state = reducer(state, { type: 'JOIN_GAME', payload: { playerId: `P2`, name: `P2`, isBot: true, botStrategy: 'bucket' } });
state = reducer(state, { type: 'START_GAME', payload: {} });

let count = 0;
while (state.status === 'Playing' && count < 50) {
    if (state.actionQueue && state.actionQueue.length > 0) {
        const nextQ = state.actionQueue[0];
        console.log(nextQ.action.type);
        state = { ...state, actionQueue: state.actionQueue.slice(1) };
        state = reducer(state, { ...nextQ.action, gameId: 'SIM', __isSimulation: true } as any);
        count++;
    } else {
        state = reducer(state, { type: 'NOP', gameId: 'SIM', __isSimulation: true } as any);
    }
}
