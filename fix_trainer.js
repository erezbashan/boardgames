const fs = require('fs');
let trainerCode = fs.readFileSync('games/king-of-tokyo/scripts/exact_state_trainer.ts', 'utf-8');

const simStart = trainerCode.indexOf("                            let keep = false;");
const simEnd = trainerCode.indexOf("                            if (keep) newDice.push(val);");

const newSimTurn = `
                            if (val === 'Smash' && tactic.ATT) {
                                keep = true;
                            } else if (val === 'Heart' && tactic.HLT && tok === 0) {
                                if (mHlt + keptHearts < 9) {
                                    keep = true;
                                    keptHearts++;
                                }
                            } else if (val === 'Energy' && tactic.ENR) {
                                keep = true;
                            }
                            
                            if (!keep && ['1', '2', '3'].includes(val) && tactic.VPS) {
                                if (keepValues.has(val)) keep = true;
                            }
`;

// Wait, the trainer simulates all 46,656 combinations EXACTLY!
// Let me look at the trainer code.
