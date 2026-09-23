require.extensions['.css'] = () => {};
import { KotState } from '../src/engine/types';
import { kingOfTokyoReducer as reducer } from '../src/engine/reducer';

function getStateKey(myVp: number, myHlt: number, myTok: number, oppVp: number, oppHlt: number) {
    return `${Math.min(20, Math.max(0, myVp))}_${Math.min(10, Math.max(1, myHlt))}_${myTok}_${Math.min(20, Math.max(0, oppVp))}_${Math.min(10, Math.max(1, oppHlt))}`;
}

function createGame(): KotState {
    let state = reducer(undefined as any, { type: 'INIT_GAME', payload: { settings: { maxHealth: 10, maxVp: 20 } } });
    state = reducer(state, { type: 'JOIN_GAME', payload: { playerId: `P1`, name: `P1`, isBot: true, botStrategy: 'bucket' } });
    state = reducer(state, { type: 'JOIN_GAME', payload: { playerId: `P2`, name: `P2`, isBot: true, botStrategy: 'bucket' } });
    state = reducer(state, { type: 'START_GAME', payload: {} });
    return state;
}

const stateStats: Record<string, number> = {};
let completed = 0;

for (let i = 0; i < 10000; i++) {
    let state = createGame();
    let turnCount = 0;
    
    let lastActiveIdx = state.currentPlayerIndex;
    
    while (state.status === 'Playing' && turnCount < 200) {
        if (state.currentPlayerIndex !== lastActiveIdx) {
            const lastPlayerId = state.playerOrder[lastActiveIdx];
            const p = state.players[lastPlayerId];
            if (p && p.health > 0) {
                const otherPlayerId = state.playerOrder.find(id => id !== lastPlayerId && state.players[id].health > 0);
                if (otherPlayerId) {
                    const opp = state.players[otherPlayerId];
                    const key = getStateKey(p.vp, p.health, p.location.startsWith('Tokyo') ? 1 : 0, opp.vp, opp.health);
                    if (!stateStats[key]) stateStats[key] = 0;
                    stateStats[key]++;
                }
            }
            lastActiveIdx = state.currentPlayerIndex;
            turnCount++;
        }

        if (state.actionQueue && state.actionQueue.length > 0) {
            const nextQ = state.actionQueue[0];
            state = { ...state, actionQueue: state.actionQueue.slice(1) };
            state = reducer(state, { ...nextQ.action, gameId: 'SIM', __isSimulation: true } as any);
        } else {
            state = reducer(state, { type: 'NOP', gameId: 'SIM', __isSimulation: true } as any);
        }
    }
}

let countOver5 = 0;
for (const [key, visits] of Object.entries(stateStats)) {
    if (visits >= 5) countOver5++; // proportional to 500k games
}
console.log('Unique states over threshold:', countOver5, 'out of total visited:', Object.keys(stateStats).length);
