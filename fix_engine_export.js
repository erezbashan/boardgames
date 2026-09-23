const fs = require('fs');
const file = 'games/acquire/src/engine/engine.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/function canEndGame\(state/g, 'export function canEndGame(state');
fs.writeFileSync(file, content);
