import * as fs from 'fs';
import * as path from 'path';

const VTable: Record<string, number> = {};
const Tactics: Record<string, { YLD: boolean, DICE: string }> = {};

function getStateKey(mVp: number, mHlt: number, oVp: number, oHlt: number, tok: number) {
    return `${mVp}|${mHlt}|${oVp}|${oHlt}|${tok}`;
}

// 1. Initialize VTable
console.log("Initializing VTable...");
for (let mVp = 0; mVp < 20; mVp++) {
    for (let mHlt = 1; mHlt <= 10; mHlt++) {
        for (let oVp = 0; oVp < 20; oVp++) {
            for (let oHlt = 1; oHlt <= 10; oHlt++) {
                for (let tok of [0, 1]) {
                    VTable[getStateKey(mVp, mHlt, oVp, oHlt, tok)] = 0.5; // 1/nPlayers
                }
            }
        }
    }
}

function getV(mVp: number, mHlt: number, oVp: number, oHlt: number, tok: number): number {
    if (mHlt <= 0) return 0.0;
    if (oHlt <= 0) return 1.0;
    if (mVp >= 20) return 1.0;
    if (oVp >= 20) return 0.0;
    const key = getStateKey(mVp, mHlt, oVp, oHlt, tok);
    return VTable[key] !== undefined ? VTable[key] : 0.5;
}

// 2. Precompute all 46,656 dice roll combinations
console.log("Precomputing dice space...");
const FACES = ['1', '2', '3', 'Heart', 'Smash', 'Energy'];
const allRolls: Record<string, number> = {}; // outcome -> probability weight (1/46656)

// A simple recursive function to build outcomes
function buildRolls(diceLeft: number, currentOutcome: { vp1: number, vp2: number, vp3: number, hlt: number, dmg: number }) {
    if (diceLeft === 0) {
        let vp = 0;
        if (currentOutcome.vp1 >= 3) vp += 1 + (currentOutcome.vp1 - 3);
        if (currentOutcome.vp2 >= 3) vp += 2 + (currentOutcome.vp2 - 3);
        if (currentOutcome.vp3 >= 3) vp += 3 + (currentOutcome.vp3 - 3);
        const key = `${vp}|${currentOutcome.dmg}|${currentOutcome.hlt}`;
        allRolls[key] = (allRolls[key] || 0) + 1;
        return;
    }
    for (let f of FACES) {
        const next = { ...currentOutcome };
        if (f === '1') next.vp1++;
        if (f === '2') next.vp2++;
        if (f === '3') next.vp3++;
        if (f === 'Heart') next.hlt++;
        if (f === 'Smash') next.dmg++;
        buildRolls(diceLeft - 1, next);
    }
}
buildRolls(6, { vp1: 0, vp2: 0, vp3: 0, hlt: 0, dmg: 0 });

const ROLL_OUTCOMES = Object.keys(allRolls).map(k => {
    const [vp, dmg, hlt] = k.split('|').map(Number);
    return { vp, dmg, hlt, prob: allRolls[k] / 46656.0 };
});
console.log(`Unique final dice outcomes: ${ROLL_OUTCOMES.length}`);

// We will use a simplified approach to keeping dice:
// We evaluate "Expectation of rolling random" vs "Current Value".
// But we actually have 3 rolls! To do perfect expected value of 3 rolls requires retrograde over the 3 roll states.
// For now, let's assume we just roll 6 dice once (equivalent to "keep nothing and accept").
// Adding 3-roll logic drastically increases computation. Let's do 1-roll approximation for V-Table first.

// 3. Value Iteration Sweep
console.log("Starting Value Iteration Sweeps...");

let sweeps = 0;
let maxDelta = 1.0;

while (maxDelta > 0.005 && sweeps < 50) {
    maxDelta = 0;
    sweeps++;
    const newVTable: Record<string, number> = {};
    
    // We sweep backwards from high VP to low VP to propagate end-game faster
    for (let mVp = 19; mVp >= 0; mVp--) {
        for (let oVp = 19; oVp >= 0; oVp--) {
            for (let mHlt = 10; mHlt >= 1; mHlt--) {
                for (let oHlt = 10; oHlt >= 1; oHlt--) {
                    for (let tok of [0, 1]) {
                        // Current state is START of my turn.
                        // 1. If I start in Tokyo, I gain 2 VP.
                        let start_mVp = mVp;
                        if (tok === 1) {
                            start_mVp = Math.min(20, start_mVp + 2);
                            if (start_mVp >= 20) {
                                newVTable[getStateKey(mVp, mHlt, oVp, oHlt, tok)] = 1.0;
                                continue;
                            }
                        }
                        
                        // 2. Roll 6 dice (1-roll approximation)
                        let expectedValue = 0;
                        for (let roll of ROLL_OUTCOMES) {
                            let next_mVp = Math.min(20, start_mVp + roll.vp);
                            let next_mHlt = mHlt;
                            let next_oHlt = oHlt;
                            let next_tok = tok;
                            
                            if (next_mVp >= 20) {
                                expectedValue += 1.0 * roll.prob;
                                continue;
                            }
                            
                            if (tok === 1) {
                                // I am in Tokyo.
                                next_oHlt = Math.max(0, next_oHlt - roll.dmg);
                                if (next_oHlt === 0) {
                                    expectedValue += 1.0 * roll.prob;
                                    continue;
                                }
                            } else {
                                // I am outside.
                                next_mHlt = Math.min(10, next_mHlt + roll.hlt);
                                if (roll.dmg > 0) {
                                    next_oHlt = Math.max(0, next_oHlt - roll.dmg);
                                    if (next_oHlt === 0) {
                                        expectedValue += 1.0 * roll.prob;
                                        continue;
                                    }
                                    
                                    // Opponent takes damage in Tokyo. Opponent MINIMIZES my value!
                                    // Opponent Yields (tok = 1 for me)
                                    // Opponent Stays (tok = 0 for me)
                                    // At the end of my turn, it flips. 
                                    // V(flipped) = getV(oVp, oHlt, mVp, mHlt, flipped_tok)
                                    // My value = 1.0 - V(flipped)
                                    
                                    // If Opponent Yields: I enter Tokyo (tok = 1). I gain 1 VP!
                                    let yield_mVp = Math.min(20, next_mVp + 1);
                                    let val_yield = 1.0;
                                    if (yield_mVp < 20) {
                                        val_yield = 1.0 - getV(oVp, next_oHlt, yield_mVp, next_mHlt, 0); 
                                        // flipped: Opponent is outside (tok=0) because I am inside.
                                    }
                                    
                                    let val_stay = 1.0 - getV(oVp, next_oHlt, next_mVp, next_mHlt, 1);
                                    // flipped: Opponent is inside (tok=1) because I am outside.
                                    
                                    // Opponent minimizes my value -> Opponent chooses the yield option that makes val lowest
                                    let best_val_for_me = Math.min(val_yield, val_stay);
                                    expectedValue += best_val_for_me * roll.prob;
                                    continue;
                                } else {
                                    // No damage, Tokyo is unoccupied? No, 2-player Tokyo is always occupied.
                                    // Wait, if start of game, Tokyo is unoccupied. We assume always occupied for 2P mid-game.
                                }
                            }
                            
                            // Normal flip
                            let flipped_tok = next_tok === 1 ? 0 : 1;
                            let my_val = 1.0 - getV(oVp, next_oHlt, next_mVp, next_mHlt, flipped_tok);
                            expectedValue += my_val * roll.prob;
                        }
                        
                        const key = getStateKey(mVp, mHlt, oVp, oHlt, tok);
                        const oldVal = VTable[key];
                        newVTable[key] = expectedValue;
                        maxDelta = Math.max(maxDelta, Math.abs(oldVal - expectedValue));
                    }
                }
            }
        }
    }
    
    // Swap tables
    for (const k in newVTable) {
        VTable[k] = newVTable[k];
    }
    console.log(`Sweep ${sweeps} completed. Max Delta: ${maxDelta.toFixed(5)}`);
}

console.log("Converged! Saving VTable...");
fs.writeFileSync(path.join(__dirname, '../src/bots/exactConfig.json'), JSON.stringify(VTable));
console.log("Done!");
