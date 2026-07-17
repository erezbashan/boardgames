const fs = require('fs');

// 1. App.tsx
let app = fs.readFileSync('frontend/src/App.tsx', 'utf8');

app = app.replace(
  `timerId = setTimeout(() => {\n        setShowStats(true);\n      }, 4000);`,
  `timerId = setTimeout(() => {\n        setShowStats(true);\n      }, 5000);`
);

app = app.replace(
  `<strong style={{ color: p.color || 'white' }}>{p.name}</strong> {p.isBot && '🤖'} \n                    {p.poisonTokens > 0 && <span style={{ marginLeft: '6px', color: '#ff4444', fontWeight: 'bold', display: 'inline-block', animation: 'poison-pop 0.3s ease-out' }} key={'p'+p.poisonTokens}>{Array(p.poisonTokens).fill('☠️').join('')}</span>}\n                    {(p.shrinkTokens || 0) > 0 && <span style={{ marginLeft: '6px', fontSize: '14px', display: 'inline-block' }} key={'s'+p.shrinkTokens}>{Array(p.shrinkTokens).fill('📉').join('')}</span>}`,
  `{p.isBot && <span style={{ marginRight: '4px' }}>🤖</span>}\n                    <strong style={{ color: p.color || 'white' }}>{p.name}</strong> \n                    {p.poisonTokens > 0 && <span title="Poison: Take 1 damage per poison token at the start of your turn." style={{ cursor: 'help', marginLeft: '6px', color: '#ff4444', fontWeight: 'bold', display: 'inline-block', animation: 'poison-pop 0.3s ease-out' }} key={'p'+p.poisonTokens}>{Array(p.poisonTokens).fill('☠️').join('')}</span>}\n                    {(p.shrinkTokens || 0) > 0 && <span title="Shrink Ray: Roll 1 fewer die per shrink token." style={{ cursor: 'help', marginLeft: '6px', fontSize: '14px', display: 'inline-block' }} key={'s'+p.shrinkTokens}>{Array(p.shrinkTokens).fill('🎲🚫').join('')}</span>}`
);

fs.writeFileSync('frontend/src/App.tsx', app, 'utf8');

// 2. GameOverScreen.tsx
let go = fs.readFileSync('frontend/src/GameOverScreen.tsx', 'utf8');

go = go.replace(
  `<h4 style={{ textAlign: 'left', margin: '24px 0 8px 0' }}>Who was in Tokyo?</h4>\n            <div style={{ display: 'flex', width: '100%', height: '40px', borderRadius: '4px', overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid #555' }}>\n              {chartData.map((d) => {\n                const historyForTurn = gameState.history?.filter(h => h.turnNumber === d.turnNumber) || [];\n                const tokyoPlayerId = historyForTurn.length > 0 ? historyForTurn[0].tokyoPlayerId : null;`,
  `<h4 style={{ textAlign: 'left', margin: '24px 0 8px 0' }}>Who was in Tokyo?</h4>\n            <div style={{ display: 'flex', width: '100%', height: '40px', borderRadius: '4px', overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid #555', marginBottom: '24px' }}>\n              {chartData.map((d) => {\n                const historyForTurn = gameState.history?.filter(h => h.turnNumber === d.turnNumber) || [];\n                const tokyoPlayerHistory = historyForTurn.find(h => (h as any).inTokyo);\n                const tokyoPlayerId = historyForTurn.length > 0 && historyForTurn[0].tokyoPlayerId ? historyForTurn[0].tokyoPlayerId : (tokyoPlayerHistory ? tokyoPlayerHistory.playerId : null);`
);

fs.writeFileSync('frontend/src/GameOverScreen.tsx', go, 'utf8');

// 3. backend/src/index.ts
let backend = fs.readFileSync('backend/src/index.ts', 'utf8');

backend = backend.replace(
  /if \(playerInTokyo\.cards\.some\(\(c: any\) => c\.effect\?\.jetpack\)\) \{\n            playerInTokyo\.energy \+= 2;\n            game\.logs\.push\(\`🚀 \$\{playerInTokyo\.name\} gained 2 ⚡ from Jetpack for yielding Tokyo!\`\);\n          \}/g,
  `if (playerInTokyo.cards.some((c: any) => c.effect?.jetpack)) {
            playerInTokyo.energy += 2;
            if (playerInTokyo.gameStats) playerInTokyo.gameStats.energyGained += 2;
            game.logs.push(\`🚀 \${playerInTokyo.name} gained 2 ⚡ from Jetpack for yielding Tokyo!\`);
          }`
);

backend = backend.replace(
  `  if (results.points > 0) {
    let pts = results.points;
    if (p.cards.some(c => c.effect?.omnivore)) {
      pts += 2;
      game.logs.push(\`🍖 \${p.name} gained 2 extra VP from Omnivore!\`);
    }
    p.victoryPoints = Math.min(game.settings?.winningVP || 20, p.victoryPoints + pts);
    game.logs.push(\`\${p.name} gained \${pts} VP.\`);`,
  `  if (results.points > 0) {
    let displayPts = results.points;
    if (p.cards.some(c => c.effect?.omnivore)) {
      displayPts += 2;
      game.logs.push(\`🍖 \${p.name} gained 2 extra VP from Omnivore!\`);
    }
    p.victoryPoints = Math.min(game.settings?.winningVP || 20, p.victoryPoints + displayPts);
    game.logs.push(\`\${p.name} gained \${results.points} VP.\`);`
);

backend = backend.replace(
  /📉 \$\{other\.name\} was shrunk!/g,
  `🎲🚫 \${other.name} was shrunk!`
);

fs.writeFileSync('backend/src/index.ts', backend, 'utf8');

