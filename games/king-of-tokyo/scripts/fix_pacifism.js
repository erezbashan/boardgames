const fs = require('fs');
let code = fs.readFileSync('games/king-of-tokyo/src/bots/ExactBot.ts', 'utf8');
code = code.replace(/if \(tactic\.ATT && d\.value === 'Smash'\) \{/, "if ((tactic.ATT || tokyoOccupied) && d.value === 'Smash') {");
fs.writeFileSync('games/king-of-tokyo/src/bots/ExactBot.ts', code);
