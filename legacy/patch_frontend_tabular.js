const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf8');

// Replace stat display to have a fixed width for health, or use tabular-nums
const statsTarget = `<div className="player-stats">`;
const statsNew = `<div className="player-stats" style={{ fontVariantNumeric: 'tabular-nums' }}>`;

content = content.replace(statsTarget, statsNew);

// Actually, the width of the text node changes when the number length changes (10 vs 9).
// font-variant-numeric: tabular-nums only makes digits equal width. '10' is still two digits while '9' is one digit.
// To fix the jitter, we need to make the health span have a fixed minimum width.
const healthTarget = `<span className={\`stat health \${gameState.highlightedStats?.some(s => s.playerId === p.id && s.stat === 'health') ? 'flash' : ''}\`}>❤️ {Math.max(0, p.health)} / {p.maxHealth || 10}</span>`;
const healthNew = `<span className={\`stat health \${gameState.highlightedStats?.some(s => s.playerId === p.id && s.stat === 'health') ? 'flash' : ''}\`} style={{ display: 'inline-block', minWidth: '75px' }}>❤️ {Math.max(0, p.health)} / {p.maxHealth || 10}</span>`;

content = content.replace(healthTarget, healthNew);

// Fix Poison rendering
const poisonTarget = `{p.poisonTokens > 0 && <span style={{ marginLeft: '6px', color: '#ff4444', fontWeight: 'bold' }}>☠️x{p.poisonTokens}</span>}`;
const poisonNew = `{p.poisonTokens > 0 && <span style={{ marginLeft: '6px', color: '#ff4444', fontWeight: 'bold', animation: 'poison-pop 0.3s ease-out' }} key={p.poisonTokens}>{Array(p.poisonTokens).fill('☠️').join('')}</span>}`;

content = content.replace(poisonTarget, poisonNew);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf8');
