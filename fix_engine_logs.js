const fs = require('fs');
const file = 'games/acquire/src/engine/engine.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/newState\.logs\.push\(`---`\);\n/g, '');
fs.writeFileSync(file, content);
