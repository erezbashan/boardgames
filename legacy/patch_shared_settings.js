const fs = require('fs');
let content = fs.readFileSync('shared/src/index.ts', 'utf8');

content = content.replace(
  /winningVP: number;/g,
  `winningVP: number;\n  startingDice?: number;`
);

fs.writeFileSync('shared/src/index.ts', content, 'utf8');
