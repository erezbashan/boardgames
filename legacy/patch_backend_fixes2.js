const fs = require('fs');
let content = fs.readFileSync('backend/src/index.ts', 'utf8');

content = content.replace(
  `          damageDealt: 0,
          cardsBought: 0,`,
  `          damageDealt: 0,
          playersKilled: 0,
          cardsBought: 0,`
);

fs.writeFileSync('backend/src/index.ts', content, 'utf8');
