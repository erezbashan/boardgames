const fs = require('fs');
let content = fs.readFileSync('backend/src/index.ts', 'utf8');

content = content.replace(
  /poisonTokens: 0\n/g,
  `poisonTokens: 0,\n      shrinkTokens: 0\n`
);

content = content.replace(
  /p\.poisonTokens = 0;/g,
  `p.poisonTokens = 0;\n        p.shrinkTokens = 0;`
);

fs.writeFileSync('backend/src/index.ts', content, 'utf8');
