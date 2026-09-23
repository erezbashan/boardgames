require.extensions['.css'] = () => {};
import { KotState, KotDice, KotPlayer } from '../src/engine/types';
import { kingOfTokyoReducer as reducer } from '../src/engine/reducer';
import * as fs from 'fs';

const playerStr = process.argv[2] || "2";
const allValues = JSON.parse(fs.readFileSync('games/king-of-tokyo/src/bots/post_turn_values.json', 'utf8'));
const trueValues = allValues[playerStr];

if (!trueValues) {
    console.error("No true values found for player count: " + playerStr);
    process.exit(1);
}

function getStateKey(vp: number, hlt: number, tok: number, oppVp: number, oppHlt: number) {
    return `${vp}_${hlt}_${tok}_${oppVp}_${oppHlt}`;
}

const tactics = [];
for (let vps of [true, false]) {
  for (let hlt of [true, false]) {
    for (let att of [true, false]) {
      for (let enr of [true, false]) {
        tactics.push({ VPS: vps, HLT: hlt, ATT: att, ENR: enr });
      }
    }
  }
}

function getDiceToKeep(dice: KotDice[], tactic: any, player: KotPlayer, isTokyoOccupied: boolean) {
    const kept = [];
    const counts = { '1': 0, '2': 0, '3': 0 };
    for (const d of dice) {
        if (d.value === '1' || d.value === '2' || d.value === '3') counts[d.value]++;
    }
    
    for (const d of dice) {
        if (d.kept) {
            kept.push(d.id);
            continue;
        }
        let shouldKeep = false;
        if (tactic.HLT && d.value === 'Heart' && player.health < 10 && !player.location.startsWith('Tokyo')) {
            shouldKeep = true;
        }
        if (tactic.ATT && d.value === 'Smash') {
            shouldKeep = true;
        }
        if (tactic.ENR && d.value === 'Energy') {
            shouldKeep = true;
        }
        if (tactic.VPS && (d.value === '1' || d.value === '2' || d.value === '3')) {
            if (counts[d.value] >= 2) {
                shouldKeep = true;
            }
        }
        if (shouldKeep) kept.push(d.id);
    }
    return kept;
}

function createCustomState(vp: number, hlt: number, tok: number, oppVp: number, oppHlt: number): KotState {
    let state = reducer(undefined as any, { type: 'INIT_GAME', payload: { settings: { maxHealth: 10, maxVp: 20 } } });
    state = reducer(state, { type: 'JOIN_GAME', payload: { playerId: `P1`, name: `P1`, isBot: true, botStrategy: 'bucket' } });
    for (let i = 2; i <= parseInt(playerStr); i++) {
        state = reducer(state, { type: 'JOIN_GAME', payload: { playerId: `P${i}`, name: `P${i}`, isBot: true, botStrategy: 'bucket' } });
    }
    state = reducer(state, { type: 'START_GAME', payload: {} });
    
    state.players['P1'].vp = vp;
    state.players['P1'].health = hlt;
    state.players['P1'].location = tok === 1 ? 'TokyoCity' : 'Outside';
    
    // Set actual opponent stats
    state.players['P2'].vp = oppVp;
    state.players['P2'].health = oppHlt;
    state.players['P2'].location = tok === 1 ? 'Outside' : 'TokyoCity';
    
    return state;
}

function simulateTurn(startVp: number, startHlt: number, startTok: number, oppVp: number, oppHlt: number, tactic: any): number {
    let state = createCustomState(startVp, startHlt, startTok, oppVp, oppHlt);
    const startPlayer = state.currentPlayerIndex;
    
    while (state.status === 'Playing' && state.currentPlayerIndex === startPlayer) {
        if (state.actionQueue && state.actionQueue.length > 0) {
            const nextQ = state.actionQueue[0];
            const topAction = state.pendingActions && state.pendingActions[0];
            
            if (nextQ.action.type === 'PLAY_BOT' && topAction && topAction.playerId === 'P1') {
                if (topAction.type === 'ASK_ROLL') {
                    const isTokyoOccupied = Object.values(state.players).some(p => p.location.startsWith('Tokyo'));
                    const kept = getDiceToKeep(state.dice, tactic, state.players['P1'], isTokyoOccupied);
                    state = { ...state, actionQueue: state.actionQueue.slice(1) };
                    state = reducer(state, { type: 'RESPONSE_ROLL', playerId: 'P1', payload: { keep: kept }, gameId: 'SIM', __isSimulation: true } as any);
                    continue;
                }
                if (topAction.type === 'ASK_MARKET') {
                    state = { ...state, actionQueue: state.actionQueue.slice(1) };
                    state = reducer(state, { type: 'RESPONSE_MARKET', playerId: 'P1', payload: { buyCards: [], sweep: false }, gameId: 'SIM', __isSimulation: true } as any);
                    continue;
                }
            }
            
            state = { ...state, actionQueue: state.actionQueue.slice(1) };
            state = reducer(state, { ...nextQ.action, gameId: 'SIM', __isSimulation: true } as any);
        } else {
            state = reducer(state, { type: 'NOP', gameId: 'SIM', __isSimulation: true } as any);
        }
    }
    
    const p1 = state.players['P1'];
    if (p1.health <= 0) return 0.0;
    if (p1.vp >= 20) return 1.0;
    
    const endTok = p1.location.startsWith('Tokyo') ? 1 : 0;
    const endVp = Math.min(20, Math.max(0, p1.vp));
    const endHlt = Math.min(10, Math.max(1, p1.health));
    const p2 = state.players['P2'];
    const finalOppVp = p2 ? Math.min(20, Math.max(0, p2.vp)) : 0;
    const finalOppHlt = p2 && p2.health > 0 ? Math.min(10, Math.max(1, p2.health)) : 0;
    const endKey = getStateKey(endVp, endHlt, endTok, finalOppVp, finalOppHlt);
    
    if (trueValues[endKey] !== undefined) return trueValues[endKey];
    
    // Fallback heuristic for unvisited states (to prevent pacifism/zero-EV traps)
    let advantage = (endVp - finalOppVp) * 0.03 + (endHlt - finalOppHlt) * 0.02;
    if (endTok === 1) advantage -= 0.02;
    return Math.max(0, Math.min(1, 0.5 + advantage));
}

const BATCH_SIZE = 100;
const MAX_SIMS = 1000;
const Z_SCORE = 1.96; // 95% confidence interval

const outFile = 'games/king-of-tokyo/src/bots/stat_optimized_tactics.json';
let existingData: Record<string, any> = {};
if (fs.existsSync(outFile)) {
    try {
        existingData = JSON.parse(fs.readFileSync(outFile, 'utf8'));
    } catch (e) {}
}
if (!existingData[playerStr]) {
    existingData[playerStr] = {};
}
const finalTactics: Record<string, any> = existingData[playerStr];

const allStates = Object.keys(trueValues);
const statesToOptimize = allStates.filter(s => !finalTactics[s]);
console.log(`Starting rigorous statistical optimization for ${statesToOptimize.length} states (Skipped ${allStates.length - statesToOptimize.length} existing states for ${playerStr} players)`);

let completed = 0;
const startTime = Date.now();

for (const stateKey of statesToOptimize) {
    const parts = stateKey.split('_');
    const startVp = parseInt(parts[0]);
    const startHlt = parseInt(parts[1]);
    const startTok = parseInt(parts[2]);
    const oppVp = parseInt(parts[3] || '0');
    const oppHlt = parseInt(parts[4] || '10');
    
    let candidates = tactics.map(t => ({ tactic: t, wins: 0, sims: 0, active: true }));
    
    while (true) {
        let activeCandidates = candidates.filter(c => c.active);
        if (activeCandidates.length === 1) break;
        
        let allMaxed = true;
        for (const c of activeCandidates) {
            if (c.sims < MAX_SIMS) {
                allMaxed = false;
                for (let i = 0; i < BATCH_SIZE; i++) {
                    c.wins += simulateTurn(startVp, startHlt, startTok, oppVp, oppHlt, c.tactic);
                    c.sims += 1;
                }
            }
        }
        
        if (allMaxed) break;
        
        const leader = activeCandidates.reduce((best, c) => (c.wins / c.sims) > (best.wins / best.sims) ? c : best, activeCandidates[0]);
        const leaderMu = leader.wins / leader.sims;
        const leaderSe = Math.sqrt((leaderMu * (1 - leaderMu)) / leader.sims) || 0.0001;
        const leaderLower = leaderMu - Z_SCORE * leaderSe;
        
        for (const c of activeCandidates) {
            if (c === leader) continue;
            const mu = c.wins / c.sims;
            const se = Math.sqrt((mu * (1 - mu)) / c.sims) || 0.0001;
            const upper = mu + Z_SCORE * se;
            
            if (upper < leaderLower) {
                c.active = false;
            }
        }
    }
    
    const best = candidates.filter(c => c.active).reduce((best, c) => (c.wins / c.sims) > (best.wins / best.sims) ? c : best, candidates.filter(c => c.active)[0]);
    finalTactics[stateKey] = { tactic: best.tactic, expectedWinRate: best.wins / best.sims, simsRun: best.sims };
    
    completed++;
    if (completed % 10 === 0) {
        console.log(`Progress: ${completed} / ${statesToOptimize.length} states completed. (Elapsed: ${((Date.now() - startTime)/1000).toFixed(1)}s)`);
    }
    if (completed % 50 === 0) {
        existingData[playerStr] = finalTactics;
        fs.writeFileSync(outFile, JSON.stringify(existingData, null, 2));
    }
}

// Final save
existingData[playerStr] = finalTactics;
fs.writeFileSync(outFile, JSON.stringify(existingData, null, 2));

console.log(`\nFinished ${playerStr} players. Output saved to ${outFile}`);
