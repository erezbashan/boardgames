const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf8');

content = content.replace(
  `{gameState.currentTurnPlayerId === playerId && gameState.rollsLeft === 0 && !gameState.isAnimating && gameState.status !== 'GameOver' && (`,
  `{gameState.currentTurnPlayerId === playerId && gameState.rollsLeft === 0 && !gameState.isAnimating && (`
);

content = content.replace(
  `disabled={!canBuy || gameState.status === 'GameOver'}`,
  `disabled={!canBuy}`
);

content = content.replace(
  `\${p.id === gameState.currentTurnPlayerId && gameState.status !== 'GameOver' ? 'active-turn' : ''}`,
  `\${p.id === gameState.currentTurnPlayerId ? 'active-turn' : ''}`
);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf8');
