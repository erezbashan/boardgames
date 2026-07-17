const fs = require('fs');

let backend = fs.readFileSync('backend/src/index.ts', 'utf8');

backend = backend.replace(
  `  if (p.inTokyo) {
    p.victoryPoints = Math.min(20, p.victoryPoints + 2);
    if (p.gameStats) p.gameStats.startedTurnInTokyoCount += 1;
    game.logs.push(\`👑 \${p.name} started their turn in Tokyo City! (+2 VP)\`);
    game.highlightedStats.push({ playerId: p.id, stat: 'vp' });
    animatedStart = true;
  }
  
  let animatedStart = false;`,
  `  let animatedStart = false;
  
  if (p.inTokyo) {
    p.victoryPoints = Math.min(20, p.victoryPoints + 2);
    if (p.gameStats) p.gameStats.startedTurnInTokyoCount += 1;
    game.logs.push(\`👑 \${p.name} started their turn in Tokyo City! (+2 VP)\`);
    game.highlightedStats.push({ playerId: p.id, stat: 'vp' });
    animatedStart = true;
  }`
);

fs.writeFileSync('backend/src/index.ts', backend, 'utf8');
