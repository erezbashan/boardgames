const fs = require('fs');
const path = 'games/acquire/src/engine/types.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /history: \{ turn: number, netWorths: Record<string, number> \}\[\];/,
  'history: { turn: number, netWorths: Record<string, number> }[];\n  turnContext?: any;'
);

fs.writeFileSync(path, content);
