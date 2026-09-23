const fs = require('fs');
let code = fs.readFileSync('games/king-of-tokyo/src/bots/ExactBot.ts', 'utf8');
code = code.replace(/import trueValues from '.\/true_state_values.json';/, "import trueValues from './post_turn_values.json';");
fs.writeFileSync('games/king-of-tokyo/src/bots/ExactBot.ts', code);
