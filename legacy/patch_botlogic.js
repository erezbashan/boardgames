const fs = require('fs');
let content = fs.readFileSync('backend/src/botLogic.ts', 'utf8');

// Fix bot stats and log formatting
content = content.replace(
  `      game.deckCount = game.deck.length;
      game.logs.push(\`BUY_CARD:\${bot.name}:\${JSON.stringify(cardToBuy)}\`);`,
  `      game.deckCount = game.deck.length;
      if (bot.gameStats) {
        bot.gameStats.cardsBought += 1;
        bot.gameStats.energySpent += cardToBuy.cost;
      }
      game.logs.push(\`\${bot.name} bought \${cardToBuy.name} for \${cardToBuy.cost} ⚡!\`);`
);

fs.writeFileSync('backend/src/botLogic.ts', content, 'utf8');
