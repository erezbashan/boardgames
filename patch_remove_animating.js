const fs = require('fs');
let backend = fs.readFileSync('backend/src/index.ts', 'utf8');

backend = backend.replace(
  `        game.highlightedStats.push({ playerId: p.id, stat: 'vp' });\n        game.isAnimating = true;`,
  `        game.highlightedStats.push({ playerId: p.id, stat: 'vp' });`
);

fs.writeFileSync('backend/src/index.ts', backend, 'utf8');
