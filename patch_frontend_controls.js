const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf8');

// Stop "PLAYING" from blinking when game is over
content = content.replace(
  `animation: 'flash-btn 1.5s infinite'`,
  `animation: gameState.status === 'GameOver' ? 'none' : 'flash-btn 1.5s infinite'`
);

// Hide the entire controls panel when game is over
content = content.replace(
  `<div className="controls">`,
  `<div className="controls" style={{ display: gameState.status === 'GameOver' ? 'none' : 'block' }}>`
);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf8');
