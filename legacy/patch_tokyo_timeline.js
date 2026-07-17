const fs = require('fs');

// 1. Fix backend history
let backend = fs.readFileSync('backend/src/index.ts', 'utf8');
backend = backend.replace(
  `inTokyo: p.inTokyo`,
  `tokyoPlayerId: Object.values(game.players).find(x => x.inTokyo)?.id || null`
);
fs.writeFileSync('backend/src/index.ts', backend, 'utf8');

// 2. Fix shared history
let shared = fs.readFileSync('shared/src/index.ts', 'utf8');
shared = shared.replace(
  `inTokyo?: boolean;`,
  `tokyoPlayerId?: string | null;`
);
fs.writeFileSync('shared/src/index.ts', shared, 'utf8');

// 3. Fix frontend GameOverScreen
let gameover = fs.readFileSync('frontend/src/GameOverScreen.tsx', 'utf8');

// Remove current Tokyo timeline block
const tokyoTimelineRegex = /<h4 style=\{\{ textAlign: 'left', margin: '24px 0 8px 0' \}\}>Who was in Tokyo\?<\/h4>[\s\S]*?<span>Turn \{chartData\.length > 0 \? chartData\[chartData\.length - 1\]\.turnNumber : 0\}<\/span>\s*<\/div>/;

gameover = gameover.replace(tokyoTimelineRegex, '');

// Create new Tokyo timeline block
const newTokyoTimeline = `            <h4 style={{ textAlign: 'left', margin: '24px 0 8px 0' }}>Who was in Tokyo?</h4>
            <div style={{ display: 'flex', width: '100%', height: '40px', borderRadius: '4px', overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid #555' }}>
              {chartData.map((d) => {
                const historyForTurn = gameState.history?.filter(h => h.turnNumber === d.turnNumber) || [];
                const tokyoPlayerId = historyForTurn.length > 0 ? historyForTurn[0].tokyoPlayerId : null;
                const player = tokyoPlayerId ? gameState.players[tokyoPlayerId] : null;
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
            </div>`;

// Insert it below Game Progress
gameover = gameover.replace(
  `<h3 style={{ marginBottom: '16px' }}>Game Progress</h3>`,
  `<h3 style={{ marginBottom: '16px' }}>Game Progress</h3>\n${newTokyoTimeline}`
);

fs.writeFileSync('frontend/src/GameOverScreen.tsx', gameover, 'utf8');
