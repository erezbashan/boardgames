require.extensions['.css'] = () => {};
import { KotState } from '../src/engine/types';
import { kingOfTokyoReducer as reducer } from '../src/engine/reducer';
import * as fs from 'fs';

const GAMES_PER_MATCHUP = 10000;
const MAX_TURNS = 200;

function createGame(numPlayers: number): KotState {
    let state = reducer(undefined as any, { type: 'INIT_GAME', payload: { settings: { maxHealth: 10, maxVp: 20 } } });
    
    // ExactBot vs BucketBots
    state = reducer(state, { type: 'JOIN_GAME', payload: { playerId: `P1`, name: `ExactBot`, isBot: true, botStrategy: 'exact' } });
    for (let i = 2; i <= numPlayers; i++) {
        state = reducer(state, { type: 'JOIN_GAME', payload: { playerId: `P${i}`, name: `BucketBot${i}`, isBot: true, botStrategy: 'bucket' } });
    }
    
    state = reducer(state, { type: 'START_GAME', payload: {} });
    return state;
}

function simulateGame(numPlayers: number): string {
    let state = createGame(numPlayers);
    let turnCount = 0;
    
    while (state.status === 'Playing' && turnCount < MAX_TURNS) {
        if (state.actionQueue && state.actionQueue.length > 0) {
            const nextQ = state.actionQueue[0];
            state = { ...state, actionQueue: state.actionQueue.slice(1) };
            if (nextQ.action.type === 'START_TURN') turnCount++;
            state = reducer(state, { ...nextQ.action, gameId: 'SIM', __isSimulation: true } as any);
        } else {
            state = reducer(state, { type: 'NOP', gameId: 'SIM', __isSimulation: true } as any);
        }
    }
    
    if (state.status !== 'Finished') return 'Draw';
    
    const winners = Object.values(state.players).filter(p => p.health > 0);
    if (winners.length === 1) return winners[0].name;
    const vpWinners = winners.filter(p => p.vp >= 20);
    if (vpWinners.length > 0) return vpWinners[0].name;
    return 'Draw';
}

console.log(`Starting ExactBot vs BucketBot Tournament (${GAMES_PER_MATCHUP} Games each)...`);

for (let p = 2; p <= 6; p++) {
    console.log(`\n--- ${p}-Player Game ---`);
    let exactWins = 0;
    let bucketWins = 0;
    let draws = 0;
    
    for (let i = 0; i < GAMES_PER_MATCHUP; i++) {
        const winner = simulateGame(p);
        if (winner === 'ExactBot') exactWins++;
        else if (winner.startsWith('BucketBot')) bucketWins++;
        else draws++;
    }
    
    const totalGames = exactWins + bucketWins;
    const exactWinRate = exactWins / totalGames;
    const bucketWinRate = bucketWins / totalGames;
    
    console.log(`ExactBot:  ${exactWins} wins (${(exactWinRate * 100).toFixed(1)}%)`);
    console.log(`BucketBot: ${bucketWins} wins (${(bucketWinRate * 100).toFixed(1)}%)`);
    console.log(`Draws/Timeouts: ${draws}`);
}
