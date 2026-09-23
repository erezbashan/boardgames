const fs = require('fs');
let code = fs.readFileSync('games/king-of-tokyo/scripts/mc_evaluator.ts', 'utf-8');

code = code.replace("if (topAction?.type === 'ASK_ROLL' && (state.rollCount || 0) === 0) {", "if (topAction?.type === 'ASK_ROLL' && state.rollCount === (state.maxRolls || 3)) {");

fs.writeFileSync('games/king-of-tokyo/scripts/mc_evaluator.ts', code);
