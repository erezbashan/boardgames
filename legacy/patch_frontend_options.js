const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf8');

content = content.replace(
  `<div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Starting Health:</span>`,
  `<div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Starting Dice:</span>
                <strong>{gameState.settings?.startingDice || 6}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Starting Health:</span>`
);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf8');

let gameover = fs.readFileSync('frontend/src/GameOverScreen.tsx', 'utf8');

// Remove Energy graph
gameover = gameover.replace(
  /<h4 style=\{\{ textAlign: 'left', margin: '24px 0 8px 0' \}\}>Energy<\/h4>[\s\S]*?<\/ResponsiveContainer>/,
  ''
);

fs.writeFileSync('frontend/src/GameOverScreen.tsx', gameover, 'utf8');
