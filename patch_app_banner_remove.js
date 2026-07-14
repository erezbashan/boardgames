const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf8');

const overlayRegex = /\{showWinnerBanner && gameState\?\.winner && \([\s\S]*?<\/div>\s*\)\}/m;
content = content.replace(overlayRegex, '');

// Also we need to add the winner banner to the player card.
const playerCardBadge = `
                {p.id === gameState.winner ? (
                  <div className="tokyo-badge" style={{ background: '#fbbf24', color: '#78350f', borderColor: '#f59e0b', boxShadow: '0 0 20px rgba(251, 191, 36, 0.8)', animation: 'pulse-glow 1.5s infinite' }}>WINNER 🏆</div>
                ) : p.health <= 0 ? (
                  <div className="tokyo-badge" style={{ background: 'var(--danger)', color: 'white', borderColor: '#7f1d1d', boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)' }}>DEAD</div>
                ) : p.inTokyo ? (
                  <div className="tokyo-badge">IN TOKYO</div>
                ) : null}
`;

const oldBadge = `{p.health <= 0 ? (
                  <div className="tokyo-badge" style={{ background: 'var(--danger)', color: 'white', borderColor: '#7f1d1d', boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)' }}>DEAD</div>
                ) : p.inTokyo ? (
                  <div className="tokyo-badge">IN TOKYO</div>
                ) : null}`;

content = content.replace(oldBadge, playerCardBadge);

// Add pulse-glow animation to index.css if not there
fs.writeFileSync('frontend/src/App.tsx', content, 'utf8');
