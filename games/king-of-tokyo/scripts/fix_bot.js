const fs = require('fs');
let code = fs.readFileSync('games/king-of-tokyo/src/bots/ExactBot.ts', 'utf8');
code = code.replace(/optimizedTactics\[playerStr\]/g, "(optimizedTactics as any)[playerStr]");
code = code.replace(/trueValues\[playerStr\]/g, "(trueValues as any)[playerStr]");
fs.writeFileSync('games/king-of-tokyo/src/bots/ExactBot.ts', code);
