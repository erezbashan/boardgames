const fs = require('fs');
let code = fs.readFileSync('games/king-of-tokyo/src/engine/reducer.ts', 'utf8');
code = code.replace(/\\nfunction doAction/g, '\nfunction doAction');
fs.writeFileSync('games/king-of-tokyo/src/engine/reducer.ts', code);
