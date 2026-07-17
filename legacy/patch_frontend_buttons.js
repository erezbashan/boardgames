const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf8');

// Hide Sweep/End Turn buttons on game over
content = content.replace(
  `{gameState.currentTurnPlayerId === playerId && gameState.rollsLeft === 0 && !gameState.isAnimating && (`,
  `{gameState.currentTurnPlayerId === playerId && gameState.rollsLeft === 0 && !gameState.isAnimating && gameState.status !== 'GameOver' && (`
);

// Hide Buy button on game over
content = content.replace(
  `disabled={!canBuy}`,
  `disabled={!canBuy || gameState.status === 'GameOver'}`
);

// Hide Roll controls on game over (wrap the whole section)
content = content.replace(
  `{gameState.currentTurnPlayerId === playerId ? (`,
  `{gameState.currentTurnPlayerId === playerId && gameState.status !== 'GameOver' ? (`
);

// Also stop active-turn blinking
content = content.replace(
  `\${p.id === gameState.currentTurnPlayerId ? 'active-turn' : ''}`,
  `\${p.id === gameState.currentTurnPlayerId && gameState.status !== 'GameOver' ? 'active-turn' : ''}`
);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf8');
