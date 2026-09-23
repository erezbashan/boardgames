require.extensions['.css'] = () => {};
import { KotState } from '../src/engine/types';
import { kingOfTokyoReducer as reducer } from '../src/engine/reducer';
import * as fs from 'fs';

const NUM_SIMS = 100000;

function getStateKey(vp: number, hlt: number, tok: number) {
    return `${vp}_${hlt}_${tok}`;
}

function createGame(numPlayers: number): KotState {
    let state = reducer(undefined as any, { type: 'INIT_GAME', payload: { settings: { maxHealth: 10, maxVp: 20 } } });
    for (let i = 1; i <= numPlayers; i++) {
        state = reducer(state, { type: 'JOIN_GAME', payload: { playerId: `P${i}`, name: `P${i}_Bucket`, isBot: true, botStrategy: 'bucket' } });
    }
    state = reducer(state, { type: 'START_GAME', payload: {} });
    return state;
}

function simulateGame(numPlayers: number, stateStats: Record<string, { visits: number, wins: number }>) {
    let state = createGame(numPlayers);
    let turnCount = 0;
    
    const playerVisitedStates: Record<string, Set<string>> = {};
    for (let i = 1; i <= numPlayers; i++) {
        playerVisitedStates[`P${i}`] = new Set<string>();
    }
    
    let lastTurnMarker = "";

    while (state.status === 'Playing' && turnCount < 50000) {
        turnCount++;
        
        const topAction = state.pendingActions && state.pendingActions[0];
        if (topAction?.type === 'ASK_ROLL' && state.rollCount === (state.maxRolls || 3)) {
            const activePlayerId = topAction.payload?.prompt?.playerId;
            if (activePlayerId && state.players[activePlayerId]) {
                const turnMarker = `${activePlayerId}_${state.logs.length}`;
                if (lastTurnMarker !== turnMarker) {
                    lastTurnMarker = turnMarker;
                    const p = state.players[activePlayerId];
                    if (p.health > 0) {
                        const vp = Math.min(20, p.vp);
                        const hlt = Math.min(10, p.health);
                        const tok = p.location.startsWith('Tokyo') ? 1 : 0;
                        const key = getStateKey(vp, hlt, tok);
                        playerVisitedStates[activePlayerId].add(key);
                    }
                }
            }
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
    if (winners.length === 1) {
        winnerId = winners[0].id;
    } else if (winners.length > 1) {
        const vpWinners = winners.filter(p => p.vp >= 20);
        if (vpWinners.length > 0) winnerId = vpWinners[0].id;
    }
    
    for (const [pId, visited] of Object.entries(playerVisitedStates)) {
        const isWinner = (pId === winnerId);
        for (const stateKey of visited) {
            if (!stateStats[stateKey]) {
                stateStats[stateKey] = { visits: 0, wins: 0 };
            }
            stateStats[stateKey].visits++;
            if (isWinner) {
                stateStats[stateKey].wins++;
            }
        }
    }
}

const allResults: Record<string, Record<string, number>> = {};

console.log(`Starting Monte Carlo State Evaluation...`);

for (let p = 2; p <= 6; p++) {
    console.log(`\nEvaluating ${p}-Player games (${NUM_SIMS} sims)...`);
    const stateStats: Record<string, { visits: number, wins: number }> = {};
    const start = Date.now();
    let lastLog = Date.now();

    for (let i = 1; i <= NUM_SIMS; i++) {
        simulateGame(p, stateStats);
        if (Date.now() - lastLog > 5000) {
            lastLog = Date.now();
            console.log(`  Progress: ${i} / ${NUM_SIMS} games (${((i/NUM_SIMS)*100).toFixed(1)}%)`);
        }
    }
    const elapsed = (Date.now() - start) / 1000;
    console.log(`  Finished ${p}-Player evaluation in ${elapsed.toFixed(1)}s.`);
    
    allResults[p] = {};
    for (const [key, stats] of Object.entries(stateStats)) {
        if (stats.visits >= 5) {
            allResults[p][key] = stats.wins / stats.visits;
        }
    }
}

fs.writeFileSync('games/king-of-tokyo/src/bots/true_state_values.json', JSON.stringify(allResults, null, 2));
console.log(`\nSaved true_state_values.json to src/bots/!`);

