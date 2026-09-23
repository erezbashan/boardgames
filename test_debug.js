const fs = require('fs');
let code = fs.readFileSync('games/king-of-tokyo/scripts/mc_evaluator.ts', 'utf-8');

code = code.replace("if (activePlayerId && state.players[activePlayerId]) {", "if (!activePlayerId) console.log('topAction', JSON.stringify(topAction));\nif (activePlayerId && state.players[activePlayerId]) {");

fs.writeFileSync('games/king-of-tokyo/scripts/mc_evaluator_debug.ts', code);
