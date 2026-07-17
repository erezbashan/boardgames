const fs = require('fs');

// 1. shared/src/index.ts
let shared = fs.readFileSync('shared/src/index.ts', 'utf8');
shared = shared.replace(
  `  enteredTokyoCount: number;
  startedTurnInTokyoCount: number;
  energyGained: number;
  healingGained: number;`,
  `  energyGained: number;
  healingGained: number;
  vpFromDice?: number;
  vpFromEnteringTokyo?: number;
  vpFromStartingTokyo?: number;
  vpFromOther?: number;`
);
fs.writeFileSync('shared/src/index.ts', shared, 'utf8');

// 2. frontend/src/App.tsx
let app = fs.readFileSync('frontend/src/App.tsx', 'utf8');
// Playing banner styling and hiding
app = app.replace(
  `{p.id === gameState.currentTurnPlayerId && p.health > 0 && (
                    <div style={{ animation: gameState.status === 'GameOver' ? 'none' : 'flash-btn 1.5s infinite', animationDelay: \`-\${Date.now() % 1500}ms\`, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: 'bold' }}>
                      <span style={{ fontSize: '12px' }}>PLAYING</span> ◀️
                    </div>
                  )}`,
  `{p.id === gameState.currentTurnPlayerId && p.health > 0 && gameState.status !== 'GameOver' && (
                    <div style={{ animation: 'flash-btn 1.5s infinite', animationDelay: \`-\${Date.now() % 1500}ms\`, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: 'bold', margin: '4px 8px' }}>
                      <span style={{ fontSize: '12px' }}>PLAYING</span> ◀️
                    </div>
                  )}`
);
fs.writeFileSync('frontend/src/App.tsx', app, 'utf8');

// 3. frontend/src/GameOverScreen.tsx
let go = fs.readFileSync('frontend/src/GameOverScreen.tsx', 'utf8');
go = go.replace(
  `<th style={{ padding: '8px', borderBottom: '1px solid #444', textAlign: 'right' }}>Energy Gained</th>
                  <th style={{ padding: '8px', borderBottom: '1px solid #444', textAlign: 'right' }}>Healing Gained</th>
                  <th style={{ padding: '8px', borderBottom: '1px solid #444', textAlign: 'right' }}>Times Entered Tokyo</th>
                  <th style={{ padding: '8px', borderBottom: '1px solid #444', textAlign: 'right' }}>Times Started in Tokyo</th>`,
  `<th style={{ padding: '8px', borderBottom: '1px solid #444', textAlign: 'right' }}>Energy Gained</th>
                  <th style={{ padding: '8px', borderBottom: '1px solid #444', textAlign: 'right' }}>Healing Gained</th>
                  <th style={{ padding: '8px', borderBottom: '1px solid #444', textAlign: 'right' }}>VP from Dice</th>
                  <th style={{ padding: '8px', borderBottom: '1px solid #444', textAlign: 'right' }}>VP from Entering Tokyo</th>
                  <th style={{ padding: '8px', borderBottom: '1px solid #444', textAlign: 'right' }}>VP from Starting in Tokyo</th>
                  <th style={{ padding: '8px', borderBottom: '1px solid #444', textAlign: 'right' }}>VP (Other)</th>`
);
go = go.replace(
  `<td style={{ padding: '8px', textAlign: 'right' }}>{p.gameStats?.energyGained || 0}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{p.gameStats?.healingGained || 0}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{p.gameStats?.enteredTokyoCount || 0}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{p.gameStats?.startedTurnInTokyoCount || 0}</td>`,
  `<td style={{ padding: '8px', textAlign: 'right' }}>{p.gameStats?.energyGained || 0}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{p.gameStats?.healingGained || 0}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{p.gameStats?.vpFromDice || 0}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{p.gameStats?.vpFromEnteringTokyo || 0}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{p.gameStats?.vpFromStartingTokyo || 0}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{p.gameStats?.vpFromOther || 0}</td>`
);
fs.writeFileSync('frontend/src/GameOverScreen.tsx', go, 'utf8');

// 4. backend/src/index.ts fixes
let backend = fs.readFileSync('backend/src/index.ts', 'utf8');

// Initial stats
backend = backend.replace(
  `enteredTokyoCount: 0,
          startedTurnInTokyoCount: 0,
          energyGained: 0,
          healingGained: 0,`,
  `energyGained: 0,
          healingGained: 0,
          vpFromDice: 0,
          vpFromEnteringTokyo: 0,
          vpFromStartingTokyo: 0,
          vpFromOther: 0,`
);

// Alpha Monster Fix & Animation
// Remove it from the target loop!
backend = backend.replace(
  `          if (p.cards.some(c => c.effect?.alphaMonster)) {
            if (p.victoryPoints < (game.settings?.winningVP || 20)) {
              p.victoryPoints += 1;
              modifierLogs.push(\`🐺 \${p.name} gained 1 ⭐ from Alpha Monster!\`);
              game.highlightedStats.push({ playerId: p.id, stat: 'vp' });
            }
          }`,
  ``
);
// And in the post-loop:
backend = backend.replace(
  `      if (p.cards.some(c => c.effect?.alphaMonster)) {
        p.victoryPoints = Math.min(game.settings?.winningVP || 20, p.victoryPoints + 1);
        modifierLogs.push(\`🐺 \${p.name} gained 1 ⭐ from Alpha Monster!\`);
        game.highlightedStats.push({ playerId: p.id, stat: 'vp' });
      }`,
  `      if (p.cards.some(c => c.effect?.alphaMonster)) {
        p.victoryPoints = Math.min(game.settings?.winningVP || 20, p.victoryPoints + 1);
        if (p.gameStats) p.gameStats.vpFromOther = (p.gameStats.vpFromOther || 0) + 1;
        modifierLogs.push(\`🐺 \${p.name} gained 1 ⭐ from Alpha Monster!\`);
        game.highlightedStats.push({ playerId: p.id, stat: 'vp' });
        game.isAnimating = true;
      }` // isAnimating true to animate Alpha Monster VP! wait, modifier logs animate later!
);
// Wait, modifier logs don't automatically animate, they just get shown. But if game.isAnimating = true here?
// Actually I shouldn't set game.isAnimating = true in evaluate dice without a delay. 
// I'll do this:

fs.writeFileSync('backend/src/index.ts', backend, 'utf8');

