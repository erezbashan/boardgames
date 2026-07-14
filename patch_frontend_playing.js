const fs = require('fs');

let content = fs.readFileSync('frontend/src/App.tsx', 'utf8');

content = content.replace(
  /\{gameState\.currentTurnPlayerId === p\.id && \(/g,
  `{gameState.status !== 'GameOver' && gameState.currentTurnPlayerId === p.id && (`
);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf8');

