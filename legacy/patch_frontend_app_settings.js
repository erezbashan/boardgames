const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf8');

// Add state for settings
content = content.replace(
  `const [showWinnerBanner, setShowWinnerBanner] = useState(false);`,
  `const [showWinnerBanner, setShowWinnerBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [localSettings, setLocalSettings] = useState({ maxHealth: 10, startingHealth: 10, winningVP: 20 });`
);

// Fallback if previous replace didn't work because it was removed
if (!content.includes('setLocalSettings')) {
  content = content.replace(
    `const [selectedCard, setSelectedCard] = useState<Card | null>(null);`,
    `const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [localSettings, setLocalSettings] = useState({ maxHealth: 10, startingHealth: 10, winningVP: 20 });`
  );
}

// Pass settings to startGame
content = content.replace(
  `<button onClick={() => startGame(gameState.id)} className="btn primary">Start Game</button>`,
  `<button onClick={() => startGame(gameState.id, localSettings)} className="btn primary">Start Game</button>`
);

// Add editable settings to left column in Lobby
content = content.replace(
  `{(gameState.status === 'Playing' || gameState.status === 'GameOver') && (`,
  `{gameState.status === 'Lobby' && (
            <div className="glass-panel" style={{ padding: '16px', color: 'white' }}>
              <h3 style={{ marginTop: 0 }}>Game Settings</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Starting Health:
                  <input type="number" min="1" max="20" value={localSettings.startingHealth} onChange={e => setLocalSettings(s => ({...s, startingHealth: parseInt(e.target.value)||10}))} style={{ width: '60px', padding: '4px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid #555' }} />
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Max Health:
                  <input type="number" min="1" max="30" value={localSettings.maxHealth} onChange={e => setLocalSettings(s => ({...s, maxHealth: parseInt(e.target.value)||10}))} style={{ width: '60px', padding: '4px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid #555' }} />
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Winning VP:
                  <input type="number" min="1" max="50" value={localSettings.winningVP} onChange={e => setLocalSettings(s => ({...s, winningVP: parseInt(e.target.value)||20}))} style={{ width: '60px', padding: '4px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid #555' }} />
                </label>
              </div>
            </div>
          )}
          {(gameState.status === 'Playing' || gameState.status === 'GameOver') && (`
);

// Add "Game Options" button in header during gameplay
content = content.replace(
  `<button onClick={() => setShowHelp(true)} className="btn secondary">Help</button>`,
  `<button onClick={() => setShowHelp(true)} className="btn secondary">Help</button>
          {gameState.status !== 'Lobby' && <button onClick={() => setShowSettings(true)} className="btn secondary">Options</button>}`
);

// Add read-only modal during gameplay
content = content.replace(
  `{showHelp && (`,
  `{showSettings && gameState.status !== 'Lobby' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="glass-panel" style={{ position: 'relative', padding: '32px', maxWidth: '400px', width: '100%', color: 'white', textAlign: 'center' }}>
            <button onClick={() => setShowSettings(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>✕</button>
            <h2 style={{ marginTop: 0, marginBottom: '24px' }}>Game Options</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Starting Health:</span>
                <strong>{gameState.settings?.startingHealth || 10}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Max Health:</span>
                <strong>{gameState.settings?.maxHealth || 10}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Winning VP:</span>
                <strong>{gameState.settings?.winningVP || 20}</strong>
              </div>
            </div>
            <button className="btn primary" onClick={() => setShowSettings(false)} style={{ marginTop: '24px', width: '100%' }}>Close</button>
          </div>
        </div>
      )}
      
      {showHelp && (`
);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf8');
