const fs = require('fs');

let backend = fs.readFileSync('backend/src/index.ts', 'utf8');

// 1. Unstuck on boot
backend = backend.replace(
  `Object.values(games).forEach(game => {`,
  `Object.values(games).forEach(game => {
    game.isAnimating = false;
    game.pendingYields = [];`
);

// 2. Animate Tokyo VP
backend = backend.replace(
  `    game.logs.push(\`👑 \${p.name} started their turn in Tokyo City! (+2 VP)\`);\n    broadcastState(gameId);\n  }`,
  `    game.logs.push(\`👑 \${p.name} started their turn in Tokyo City! (+2 VP)\`);\n    game.highlightedStats.push({ playerId: p.id, stat: 'vp' });\n    animatedStart = true;\n  }`
);

fs.writeFileSync('backend/src/index.ts', backend, 'utf8');
