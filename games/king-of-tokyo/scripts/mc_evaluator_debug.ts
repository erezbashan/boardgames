require.extensions['.css'] = () => {};
import { KotState } from '../src/engine/types';
import { kingOfTokyoReducer as reducer } from '../src/engine/reducer';
import * as fs from 'fs';

const NUM_SIMS = 100000;
const NUM_PLAYERS = 2;

// We will track total visits and wins for each exact state:
// Key: `${vp}_${hlt}_${tok}`
// Value: { visits: number, wins: number }
const stateStats: Record<string, { visits: number, wins: number }> = {};

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

function simulateGame(): string {
    let state = createGame(NUM_PLAYERS);
    let turnCount = 0;
    
    // Track which states each player visits in this game
    const playerVisitedStates: Record<string, Set<string>> = {};
    for (let i = 1; i <= NUM_PLAYERS; i++) {
        playerVisitedStates[`P${i}`] = new Set<string>();
    }
    
    let lastTurnMarker = "";

    while (state.status === 'Playing' && turnCount < 50000) {
        turnCount++;
        
        // Record state at the exact start of a player's turn (before first roll)
        const topAction = state.pendingActions && state.pendingActions[0];
        if (topAction?.type === 'ASK_ROLL' && (state.rollCount || 0) === 0) {
            const activePlayerId = topAction.payload?.prompt?.playerId;
            if (!activePlayerId) console.log('topAction', JSON.stringify(topAction));
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
        
        // Process engine
        if (state.actionQueue && state.actionQueue.length > 0) {
            const nextQ = state.actionQueue[0];
            state = { ...state, actionQueue: state.actionQueue.slice(1) };
            state = reducer(state, { ...nextQ.action, gameId: 'SIM', __isSimulation: true } as any);
        } else {
            state = reducer(state, { type: 'NOP', gameId: 'SIM', __isSimulation: true } as any);
        }
    }
    
    // Game ended. Determine winner.
    const winners = Object.values(state.players).filter(p => p.health > 0);
    let winnerId = null;
    if (winners.length === 1) {
        winnerId = winners[0].id;
    } else if (winners.length > 1) {
        const vpWinners = winners.filter(p => p.vp >= 20);
        if (vpWinners.length > 0) winnerId = vpWinners[0].id;
    }
    
    // Update global stateStats
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
    
    return winnerId || 'Draw';
}

console.log(`Starting Monte Carlo State Evaluation (${NUM_SIMS} Games)...`);

const start = Date.now();
let lastLog = Date.now();

for (let i = 1; i <= NUM_SIMS; i++) {
    simulateGame();
    
    if (Date.now() - lastLog > 5000) {
        lastLog = Date.now();
        console.log(`Progress: ${i} / ${NUM_SIMS} games (${((i/NUM_SIMS)*100).toFixed(1)}%)`);
    }
}

const elapsed = (Date.now() - start) / 1000;
console.log(`Finished in ${elapsed.toFixed(1)} seconds.`);

// Output stats
const results: Record<string, { visits: number, winRate: number }> = {};
for (const [key, stats] of Object.entries(stateStats)) {
    if (stats.visits >= 1) {
        results[key] = {
            visits: stats.visits,
            winRate: stats.wins / stats.visits
        };
    }
}

fs.writeFileSync('games/king-of-tokyo/scripts/true_state_values.json', JSON.stringify(results, null, 2));
console.log(`Saved true_state_values.json with ${Object.keys(results).length} states recorded.`);

// Display a small sample for sanity check
console.log("\nSample Evaluated States (Min 100 visits):");
const sortedStates = Object.entries(results)
    .filter(([_, stats]) => stats.visits >= 100)
    .sort((a, b) => b[1].winRate - a[1].winRate); // Highest win rate first

console.log(`Top 5 States (Highest Win%):`);
for (let i = 0; i < 5 && i < sortedStates.length; i++) {
    console.log(`${sortedStates[i][0]} -> Win%: ${(sortedStates[i][1].winRate * 100).toFixed(1)}% (Visits: ${sortedStates[i][1].visits})`);
}

console.log(`\nBottom 5 States (Lowest Win%):`);
for (let i = Math.max(0, sortedStates.length - 5); i < sortedStates.length; i++) {
    console.log(`${sortedStates[i][0]} -> Win%: ${(sortedStates[i][1].winRate * 100).toFixed(1)}% (Visits: ${sortedStates[i][1].visits})`);
}

