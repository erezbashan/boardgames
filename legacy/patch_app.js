const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf8');

// 1. Colorize Chat Sender
content = content.replace(
  `<strong style={{ color: 'var(--primary)' }}>{msg.sender}:</strong> {msg.text}`,
  `{(() => {
                          const senderPlayer = Object.values(gameState.players).find(p => p.name === msg.sender);
                          const color = senderPlayer?.color || 'var(--primary)';
                          return <><strong style={{ color }}>{msg.sender}:</strong> {msg.text}</>;
                        })()}`
);

// 2. Colorize Log entries
content = content.replace(
  `{log}`,
  `{(() => {
                      let text = log;
                      const players = Object.values(gameState.players);
                      // Sort by name length descending so we match longer names first
                      const sortedPlayers = [...players].sort((a,b) => b.name.length - a.name.length);
                      
                      const parts = [];
                      let currentIndex = 0;
                      
                      // We need a proper tokenizer for names, but a simple replace is fine for now
                      // To avoid multiple replaces messing up the string, we can use a regex
                      // However, a simple approach is just to render it as string for now if it's too complex...
                      // Let's do a simple component that splits by player names
                      
                      const renderLog = (logText) => {
                        for (const p of sortedPlayers) {
                          if (p.name && logText.includes(p.name)) {
                            const split = logText.split(p.name);
                            return (
                              <>
                                {renderLog(split[0])}
                                <span style={{ color: p.color || 'white', fontWeight: 'bold' }}>{p.name}</span>
                                {renderLog(split.slice(1).join(p.name))}
                              </>
                            );
                          }
                        }
                        return logText;
                      };
                      return renderLog(log);
                    })()}`
);

// 3. Colorize players in right pane
content = content.replace(
  `const isCurrentTurn = gameState.currentTurnPlayerId === p.id;`,
  `const isCurrentTurn = gameState.currentTurnPlayerId === p.id;
              const pColor = p.color || 'white';`
);

content = content.replace(
  `<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>`,
  `<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>`
);

content = content.replace(
  `<h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>`,
  `<h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: pColor }}>`
);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf8');
