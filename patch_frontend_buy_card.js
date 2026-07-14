const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf8');

// Colorize name in BUY_CARD
const buyCardTarget = `                          return (
                            <div key={i} style={{ 
                              padding: '6px', 
                              background: 'rgba(0,0,0,0.2)', 
                              borderRadius: '4px',
                              borderLeft: '3px solid var(--primary)'
                            }}>
                              <strong>{pName}</strong> bought <strong onClick={() => card && setSelectedCard(card)} style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--primary)' }}>{card?.name || 'a card'}</strong> for {card?.cost || '?'} ⚡
                            </div>
                          );`;

const buyCardNew = `                          const pColor = Object.values(gameState.players).find(p => p.name === pName)?.color || 'white';
                          return (
                            <div key={i} style={{ 
                              padding: '6px', 
                              background: 'rgba(0,0,0,0.2)', 
                              borderRadius: '4px',
                              borderLeft: '3px solid var(--primary)'
                            }}>
                              <strong style={{ color: pColor }}>{pName}</strong> bought <strong onClick={() => card && setSelectedCard(card)} style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--primary)' }}>{card?.name || 'a card'}</strong> for {card?.cost || '?'} ⚡
                            </div>
                          );`;

content = content.replace(buyCardTarget, buyCardNew);
fs.writeFileSync('frontend/src/App.tsx', content, 'utf8');
