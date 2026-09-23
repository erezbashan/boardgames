require.extensions['.css'] = () => {};
import { KotState, KotDice, KotPlayer } from '../src/engine/types';
import { kingOfTokyoReducer as reducer } from '../src/engine/reducer';
import * as fs from 'fs';

const allValues = JSON.parse(fs.readFileSync('games/king-of-tokyo/src/bots/true_state_values.json', 'utf8'));

function getStateKey(vp: number, hlt: number, tok: number) {
    return `${vp}_${hlt}_${tok}`;
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

function createCustomState(vp: number, hlt: number, tok: number): KotState {
    let state = reducer(undefined as any, { type: 'INIT_GAME', payload: { settings: { maxHealth: 10, maxVp: 20 } } });
    state = reducer(state, { type: 'JOIN_GAME', payload: { playerId: `P1`, name: `P1`, isBot: true, botStrategy: 'bucket' } });
    state = reducer(state, { type: 'JOIN_GAME', payload: { playerId: `P2`, name: `P2`, isBot: true, botStrategy: 'bucket' } });
    state = reducer(state, { type: 'START_GAME', payload: {} });
    
    state.players['P1'].vp = vp;
    state.players['P1'].health = hlt;
    state.players['P1'].location = tok === 1 ? 'TokyoCity' : 'Outside';
    
    state.players['P2'].vp = 10;
    state.players['P2'].health = 10;
    state.players['P2'].location = tok === 1 ? 'Outside' : 'TokyoCity';
    
    return state;
}

function simulateTurn(startVp: number, startHlt: number, startTok: number, tactic: any, trueValues: any): number {
    let state = createCustomState(startVp, startHlt, startTok);
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
    const endVp = Math.min(20, p1.vp);
    const endHlt = Math.min(10, p1.health);
    const endKey = getStateKey(endVp, endHlt, endTok);
    
    return trueValues[endKey] !== undefined ? trueValues[endKey] : 0.0;
}

const finalTactics: Record<string, Record<string, any>> = {};

console.log(`Optimizing tactics for all player counts...`);
const start = Date.now();

for (const playerStr of ["2", "3", "4", "5", "6"]) {
    const trueValues = allValues[playerStr];
    if (!trueValues) continue;
    
    finalTactics[playerStr] = {};
    const statesToOptimize = Object.keys(trueValues);
    console.log(`Optimizing ${statesToOptimize.length} states for ${playerStr} players...`);
    
    let completed = 0;
    for (const stateKey of statesToOptimize) {
        const [vpStr, hltStr, tokStr] = stateKey.split('_');
        const startVp = parseInt(vpStr);
        const startHlt = parseInt(hltStr);
        const startTok = parseInt(tokStr);
        
        let bestTactic = null;
        let bestScore = -1;
        
        for (const tactic of tactics) {
            let totalScore = 0;
            const NUM_SIMS = 40; 
            for (let i = 0; i < NUM_SIMS; i++) {
                 totalScore += simulateTurn(startVp, startHlt, startTok, tactic, trueValues);
            }
            const avgScore = totalScore / NUM_SIMS;
            if (avgScore > bestScore) {
                bestScore = avgScore;
                bestTactic = tactic;
            }
        }
        
        finalTactics[playerStr][stateKey] = { tactic: bestTactic };
        completed++;
    }
}

fs.writeFileSync('games/king-of-tokyo/src/bots/optimized_tactics.json', JSON.stringify(finalTactics, null, 2));
console.log(`\nFinished in ${((Date.now() - start)/1000).toFixed(1)}s. Saved optimized_tactics.json`);

