const fs = require('fs');
let backend = fs.readFileSync('backend/src/index.ts', 'utf8');

// 1. vpFromDice
backend = backend.replace(
  `p.victoryPoints = Math.min(game.settings?.winningVP || 20, p.victoryPoints + displayPts);`,
  `p.victoryPoints = Math.min(game.settings?.winningVP || 20, p.victoryPoints + displayPts);\n    if (p.gameStats) p.gameStats.vpFromDice = (p.gameStats.vpFromDice || 0) + results.points;`
);

// 2. vpFromEnteringTokyo
backend = backend.replace(
  `p.victoryPoints = Math.min(20, p.victoryPoints + 1);\n      game.logs.push(\`🗼 \${p.name} entered Tokyo City! (+1 VP)\`);`,
  `p.victoryPoints = Math.min(20, p.victoryPoints + 1);\n      if (p.gameStats) p.gameStats.vpFromEnteringTokyo = (p.gameStats.vpFromEnteringTokyo || 0) + 1;\n      game.logs.push(\`🗼 \${p.name} entered Tokyo City! (+1 VP)\`);`
);

// 3. vpFromStartingTokyo
backend = backend.replace(
  `p.victoryPoints = Math.min(20, p.victoryPoints + 2);\n    if (p.gameStats) p.gameStats.startedTurnInTokyoCount += 1;`,
  `p.victoryPoints = Math.min(20, p.victoryPoints + 2);\n    if (p.gameStats) p.gameStats.vpFromStartingTokyo = (p.gameStats.vpFromStartingTokyo || 0) + 2;`
);

// 4. Herbivore and News Team and Omnivore
backend = backend.replace(
  `p.victoryPoints = Math.min(20, p.victoryPoints + 1);\n    game.logs.push(\`🌿 \${p.name} gained 1 ⭐ from Herbivore!\`);`,
  `p.victoryPoints = Math.min(20, p.victoryPoints + 1);\n    if (p.gameStats) p.gameStats.vpFromOther = (p.gameStats.vpFromOther || 0) + 1;\n    game.logs.push(\`🌿 \${p.name} gained 1 ⭐ from Herbivore!\`);`
);
backend = backend.replace(
  `player.victoryPoints = Math.min(game.settings?.winningVP || 20, player.victoryPoints + 1);\n            game.logs.push(\`📰 \${player.name} gained 1 VP from Dedicated News Team!\`);`,
  `player.victoryPoints = Math.min(game.settings?.winningVP || 20, player.victoryPoints + 1);\n            if (player.gameStats) player.gameStats.vpFromOther = (player.gameStats.vpFromOther || 0) + 1;\n            game.logs.push(\`📰 \${player.name} gained 1 VP from Dedicated News Team!\`);`
);
backend = backend.replace(
  `displayPts += 2;\n      game.logs.push(\`🍖 \${p.name} gained 2 extra VP from Omnivore!\`);`,
  `displayPts += 2;\n      if (p.gameStats) p.gameStats.vpFromOther = (p.gameStats.vpFromOther || 0) + 2;\n      game.logs.push(\`🍖 \${p.name} gained 2 extra VP from Omnivore!\`);`
);

fs.writeFileSync('backend/src/index.ts', backend, 'utf8');
