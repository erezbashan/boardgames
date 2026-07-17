const fs = require('fs');

// Patch App.tsx
let app = fs.readFileSync('frontend/src/App.tsx', 'utf8');

app = app.replace(
  `{p.poisonTokens > 0 && <span style={{ marginLeft: '6px', color: '#ff4444', fontWeight: 'bold', display: 'inline-block', animation: 'poison-pop 0.3s ease-out' }} key={p.poisonTokens}>{Array(p.poisonTokens).fill('☠️').join('')}</span>}`,
  `{p.poisonTokens > 0 && <span style={{ marginLeft: '6px', color: '#ff4444', fontWeight: 'bold', display: 'inline-block', animation: 'poison-pop 0.3s ease-out' }} key={'p'+p.poisonTokens}>{Array(p.poisonTokens).fill('☠️').join('')}</span>}
                    {(p.shrinkTokens || 0) > 0 && <span style={{ marginLeft: '6px', fontSize: '14px', display: 'inline-block' }} key={'s'+p.shrinkTokens}>{Array(p.shrinkTokens).fill('📉').join('')}</span>}`
);

app = app.replace(
  `<button onClick={() => returnToLobby(gameState.id)} className="btn danger">Return to Lobby</button>`,
  `<button onClick={() => returnToLobby(gameState.id)} className="btn primary">Rematch (Keep Players)</button>
            <button onClick={() => window.location.href = '/'} className="btn danger">New Game</button>`
);

fs.writeFileSync('frontend/src/App.tsx', app, 'utf8');

// Patch GameOverScreen.tsx
let gameover = fs.readFileSync('frontend/src/GameOverScreen.tsx', 'utf8');

gameover = gameover.replace(
  /<div style=\{\{ marginTop: '24px' \}\}>\s*<button className="btn primary" onClick=\{onLobbyReturn\}>Return to Lobby<\/button>\s*<\/div>/,
  ``
);

const tokyoTimeline = `        <h4 style={{ textAlign: 'left', margin: '24px 0 8px 0' }}>Who was in Tokyo?</h4>
        <div style={{ display: 'flex', width: '100%', height: '40px', borderRadius: '4px', overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid #555' }}>
          {chartData.map((d, i) => {
            const historyForTurn = gameState.history?.filter(h => h.turnNumber === d.turnNumber) || [];
            const tokyoPlayerHistory = historyForTurn.find(h => h.inTokyo);
            const player = tokyoPlayerHistory ? gamePlayers[tokyoPlayerHistory.playerId] : null;
            const color = player ? (player.color || '#888') : 'transparent';
            const name = player ? player.name : '';
            return (
              <div 
                key={d.turnNumber} 
                style={{ flex: 1, backgroundColor: color, borderRight: '1px solid rgba(255,255,255,0.1)', cursor: 'crosshair' }}
                title={\`Turn \${d.turnNumber}: \${name || 'Empty'}\`}
              />
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px', color: '#888' }}>
          <span>Turn 0</span>
          <span>Turn {chartData.length > 0 ? chartData[chartData.length - 1].turnNumber : 0}</span>
        </div>`;

gameover = gameover.replace(
  `{/* Stats Table */}`,
  `${tokyoTimeline}\n\n        {/* Stats Table */}`
);

fs.writeFileSync('frontend/src/GameOverScreen.tsx', gameover, 'utf8');

