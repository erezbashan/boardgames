const fs = require('fs');
let content = fs.readFileSync('backend/src/index.ts', 'utf8');
content = content.replace(
  `game.logs.push(\`\${player.name} bought \${card.name} for \${card.cost} ⚡!\`);`,
  `game.logs.push(\`BUY_CARD:\${player.name}:\${JSON.stringify(card)}\`);`
);
fs.writeFileSync('backend/src/index.ts', content, 'utf8');

content = fs.readFileSync('backend/src/botLogic.ts', 'utf8');
content = content.replace(
  `game.logs.push(\`\${bot.name} bought \${cardToBuy.name} for \${cardToBuy.cost} ⚡!\`);`,
  `game.logs.push(\`BUY_CARD:\${bot.name}:\${JSON.stringify(cardToBuy)}\`);`
);
fs.writeFileSync('backend/src/botLogic.ts', content, 'utf8');
