require.extensions['.css'] = () => {};
import { KotState } from '../src/engine/types';
import { kingOfTokyoReducer as reducer } from '../src/engine/reducer';
import * as fs from 'fs';

const NUM_SIMS = 1000000;
const playerStr = "2";

function getStateKey(vp: number, hlt: number, tok: number, oppVp: number, oppHlt: number) {
    return `${Math.min(20, Math.max(0, vp))}_${Math.min(10, Math.max(1, hlt))}_${tok}_${Math.min(20, Math.max(0, oppVp))}_${Math.min(10, Math.max(1, oppHlt))}`;
}

function createGame(): KotState {
    let state = reducer(undefined as any, { type: 'INIT_GAME', payload: { settings: { maxHealth: 10, maxVp: 20 } } });
    state = reducer(state, { type: 'JOIN_GAME', payload: { playerId: `P1`, name: `P1`, isBot: true, botStrategy: 'bucket' } });
    state = reducer(state, { type: 'JOIN_GAME', payload: { playerId: `P2`, name: `P2`, isBot: true, botStrategy: 'bucket' } });
    state = reducer(state, { type: 'START_GAME', payload: {} });
    return state;
}

const stateStats: Record<string, { visits: number, wins: number }> = {};
let completed = 0;
const start = Date.now();

for (let i = 0; i < NUM_SIMS; i++) {
    let state = createGame();
    let turnCount = 0;
    const playerVisitedStates: Record<string, Set<string>> = { 'P1': new Set(), 'P2': new Set() };
    
    let lastActiveIdx = state.currentPlayerIndex;
    
    while (state.status === 'Playing' && turnCount < 1000) {
        if (state.currentPlayerIndex !== lastActiveIdx) {
            // The previous player just finished their turn!
            const lastPlayerId = state.playerOrder[lastActiveIdx];
            const p = state.players[lastPlayerId];
            if (p && p.health > 0) {
                const oppId = state.playerOrder.find(id => id !== lastPlayerId && state.players[id].health > 0);
                if (oppId) {
                    const opp = state.players[oppId];
                    const key = getStateKey(p.vp, p.health, p.location.startsWith('Tokyo') ? 1 : 0, opp.vp, opp.health);
                    playerVisitedStates[lastPlayerId].add(key);
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
    
    const winners = Object.values(state.players).filter(p => p.health > 0);
    let winnerId = null;
    if (winners.length === 1) winnerId = winners[0].id;
    else if (winners.length > 1) {
        const vpWinners = winners.filter(p => p.vp >= 20);
        if (vpWinners.length > 0) winnerId = vpWinners[0].id;
    }
    
    for (const [pId, visited] of Object.entries(playerVisitedStates)) {
        const isWinner = (pId === winnerId);
        for (const stateKey of visited) {
            if (!stateStats[stateKey]) stateStats[stateKey] = { visits: 0, wins: 0 };
            stateStats[stateKey].visits++;
            if (isWinner) stateStats[stateKey].wins++;
        }
    }
    
    completed++;
    if (completed % 5000 === 0) {
        console.log(`Progress: ${completed} / ${NUM_SIMS}`);
    }
}

const finalValues: Record<string, number> = {};
for (const [key, stats] of Object.entries(stateStats)) {
    if (stats.visits >= 50) {
        finalValues[key] = stats.wins / stats.visits;
    }
}

fs.writeFileSync('games/king-of-tokyo/src/bots/post_turn_values.json', JSON.stringify(finalValues, null, 2));
console.log(`Finished in ${((Date.now() - start)/1000).toFixed(1)}s. Saved post_turn_values.json`);
