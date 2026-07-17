const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf8');

// Fix Game Settings alignment
content = content.replace(
  `<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
              </div>`,
  `<div style={{ display: 'grid', gridTemplateColumns: 'auto 60px', gap: '12px 16px', alignItems: 'center' }}>
                <label style={{ display: 'contents' }}>
                  <span>Starting Health:</span>
                  <input type="number" min="1" max="20" value={localSettings.startingHealth} onChange={e => setLocalSettings(s => ({...s, startingHealth: parseInt(e.target.value)||10}))} style={{ width: '60px', padding: '4px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid #555' }} />
                </label>
                <label style={{ display: 'contents' }}>
                  <span>Max Health:</span>
                  <input type="number" min="1" max="30" value={localSettings.maxHealth} onChange={e => setLocalSettings(s => ({...s, maxHealth: parseInt(e.target.value)||10}))} style={{ width: '60px', padding: '4px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid #555' }} />
                </label>
                <label style={{ display: 'contents' }}>
                  <span>Winning VP:</span>
                  <input type="number" min="1" max="50" value={localSettings.winningVP} onChange={e => setLocalSettings(s => ({...s, winningVP: parseInt(e.target.value)||20}))} style={{ width: '60px', padding: '4px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid #555' }} />
                </label>
              </div>`
);

// Fix Game Over Delay
content = content.replace(
  `{gameState.status === "GameOver" && (
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setShowStats(true)} className="btn primary">View Stats</button>`,
  `{gameState.status === "GameOver" && (
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setShowStats(true)} className="btn primary">View Stats</button>`
);
// Wait, I need to auto-open stats after 2 seconds. Let's add a useEffect for it.
if (!content.includes('useEffect(() => { if (gameState.status === \'GameOver\')')) {
  content = content.replace(
    `const [showWinnerBanner, setShowWinnerBanner] = useState(false);`,
    `const [showWinnerBanner, setShowWinnerBanner] = useState(false);
  useEffect(() => {
    if (gameState.status === 'GameOver') {
      const timer = setTimeout(() => setShowStats(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState.status]);`
  );
}

fs.writeFileSync('frontend/src/App.tsx', content, 'utf8');
