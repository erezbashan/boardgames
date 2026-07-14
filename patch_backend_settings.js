const fs = require('fs');

// Patch App.tsx to use negative animation delay
let appTsx = fs.readFileSync('frontend/src/App.tsx', 'utf8');

// Find all flash-btn and pulse styles and add animationDelay
appTsx = appTsx.replace(
  /animation: gameState\.status === 'GameOver' \? 'none' : 'flash-btn 1\.5s infinite'/g,
  `animation: gameState.status === 'GameOver' ? 'none' : 'flash-btn 1.5s infinite', animationDelay: \`-\${Date.now() % 1500}ms\``
);
appTsx = appTsx.replace(
  /className="btn primary flash"/g,
  `className="btn primary flash" style={{ animationDelay: \`-\${Date.now() % 1500}ms\` }}`
);
appTsx = appTsx.replace(
  /className="tokyo-badge flash"/g,
  `className="tokyo-badge flash" style={{ animationDelay: \`-\${Date.now() % 1500}ms\` }}`
);

// Add Starting Dice setting
appTsx = appTsx.replace(
  `const [localSettings, setLocalSettings] = useState({ maxHealth: 10, startingHealth: 10, winningVP: 20 });`,
  `const [localSettings, setLocalSettings] = useState({ maxHealth: 10, startingHealth: 10, winningVP: 20, startingDice: 6 });`
);

appTsx = appTsx.replace(
  `<div style={{ display: 'grid', gridTemplateColumns: 'auto 60px', gap: '12px 16px', alignItems: 'center' }}>`,
  `<div style={{ display: 'grid', gridTemplateColumns: 'auto 60px', gap: '12px 16px', alignItems: 'center' }}>
                <label style={{ display: 'contents' }}>
                  <span>Starting Dice:</span>
                  <input type="number" min="1" max="10" value={localSettings.startingDice || 6} onChange={e => setLocalSettings(s => ({...s, startingDice: parseInt(e.target.value)||6}))} style={{ width: '60px', padding: '4px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid #555' }} />
                </label>`
);

// Lobby player health display fix
appTsx = appTsx.replace(
  /\{p\.health\} \/ \{p\.maxHealth \|\| 10\}/g,
  `{gameState.status === 'Lobby' ? (gameState.settings?.startingHealth || 10) : p.health} / {gameState.status === 'Lobby' ? (gameState.settings?.maxHealth || 10) : (p.maxHealth || 10)}`
);

fs.writeFileSync('frontend/src/App.tsx', appTsx, 'utf8');

