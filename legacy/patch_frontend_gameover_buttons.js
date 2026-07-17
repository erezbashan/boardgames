const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf8');

// Hide Sweep/End turn wrapper
content = content.replace(
  `{gameState.currentTurnPlayerId === playerId && gameState.rollsLeft === 0 && !gameState.isAnimating && (
                    <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>`,
  `{gameState.currentTurnPlayerId === playerId && gameState.rollsLeft === 0 && !gameState.isAnimating && (
                    <div style={{ padding: '8px', display: gameState.status === 'GameOver' ? 'none' : 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>`
);

// Disable buy button
content = content.replace(
  `disabled={!canBuy}`,
  `disabled={!canBuy || gameState.status === 'GameOver'}`
);

// Hide Inline Action Buttons
content = content.replace(
  `<div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-start' }}>
                    {gameState.currentTurnPlayerId === playerId && gameState.status === 'Playing' ? (`,
  `<div style={{ display: gameState.status === 'GameOver' ? 'none' : 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-start' }}>
                    {gameState.currentTurnPlayerId === playerId && gameState.status === 'Playing' ? (`
);

// Remove 🎴 icon
content = content.replace(
  `🎴 {c.name}`,
  `{c.name}`
);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf8');
