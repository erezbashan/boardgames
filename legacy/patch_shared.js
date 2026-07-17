const fs = require('fs');
let content = fs.readFileSync('shared/src/index.ts', 'utf8');

content = content.replace(
  `  poisonTokens: number;`,
  `  poisonTokens: number;
  shrinkTokens: number;`
);

fs.writeFileSync('shared/src/index.ts', content, 'utf8');
