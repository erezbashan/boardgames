const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf8');

// Fix unused text, parts, currentIndex and missing types on renderLog
content = content.replace(
  `                      let text = log;
                      const players = Object.values(gameState.players);
                      // Sort by name length descending so we match longer names first
                      const sortedPlayers = [...players].sort((a,b) => b.name.length - a.name.length);
                      
                      const parts = [];
                      let currentIndex = 0;
                      
                      // We need a proper tokenizer for names, but a simple replace is fine for now
                      // To avoid multiple replaces messing up the string, we can use a regex
                      // However, a simple approach is just to render it as string for now if it's too complex...
                      // Let's do a simple component that splits by player names
                      
                      const renderLog = (logText) => {`,
  `                      const players = Object.values(gameState.players);
                      // Sort by name length descending so we match longer names first
                      const sortedPlayers = [...players].sort((a,b) => b.name.length - a.name.length);
                      
                      const renderLog = (logText: string): React.ReactNode => {`
);

content = content.replace("import type { Card, GameState } from '@king-of-tokyo/shared';", "import type { Card, GameState } from '@king-of-tokyo/shared';\nimport type React from 'react';");

// Implement the DEAD banner instead of [DEAD]
content = content.replace(
  `{p.health <= 0 && <span style={{ color: 'var(--danger)' }}> [DEAD]</span>}`,
  ``
);

// We need to find the "tokyo-badge" logic which is around line 400.
// We will replace it with a DEAD banner or In Tokyo banner.
content = content.replace(
  `{p.inTokyo && p.health > 0 && <div className="tokyo-badge">IN TOKYO</div>}`,
  `{p.health <= 0 ? (
                  <div className="tokyo-badge" style={{ background: 'var(--danger)', color: 'white', borderColor: '#7f1d1d', boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)' }}>DEAD</div>
                ) : p.inTokyo ? (
                  <div className="tokyo-badge">IN TOKYO</div>
                ) : null}`
);


fs.writeFileSync('frontend/src/App.tsx', content, 'utf8');
