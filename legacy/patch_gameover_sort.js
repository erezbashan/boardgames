const fs = require('fs');
let content = fs.readFileSync('frontend/src/GameOverScreen.tsx', 'utf8');

// The playerIds were sorted naturally. We will sort them based on the rules.
content = content.replace(
  `const playerIds = Object.keys(gameState.players);`,
  `const playerIds = Object.keys(gameState.players).sort((a, b) => {
    const pA = gameState.players[a];
    const pB = gameState.players[b];
    
    // 1. Winner on top
    if (gameState.winner === a) return -1;
    if (gameState.winner === b) return 1;
    
    // 2. Alive players above dead players
    const aAlive = pA.health > 0;
    const bAlive = pB.health > 0;
    if (aAlive && !bAlive) return -1;
    if (!aAlive && bAlive) return 1;
    
    // 3. If both alive, sort by VP descending
    if (aAlive && bAlive) {
      return pB.victoryPoints - pA.victoryPoints;
    }
    
    // 4. If both dead, sort by turnDied descending (latest death first)
    const turnA = pA.gameStats?.turnDied || 0;
    const turnB = pB.gameStats?.turnDied || 0;
    return turnB - turnA;
  });`
);

// Add the new columns to the table
content = content.replace(
  `<th style={{ padding: '8px' }}>Energy Spent</th>`,
  `<th style={{ padding: '8px' }}>Energy Spent</th>
                <th style={{ padding: '8px' }}>Energy Gained</th>
                <th style={{ padding: '8px' }}>Total Healing</th>
                <th style={{ padding: '8px' }}>Times Entered Tokyo</th>
                <th style={{ padding: '8px' }}>Times Started in Tokyo</th>`
);

content = content.replace(
  `<td style={{ padding: '8px' }}>{p.gameStats?.energySpent || 0}</td>`,
  `<td style={{ padding: '8px' }}>{p.gameStats?.energySpent || 0}</td>
                    <td style={{ padding: '8px' }}>{p.gameStats?.energyGained || 0}</td>
                    <td style={{ padding: '8px' }}>{p.gameStats?.healingGained || 0}</td>
                    <td style={{ padding: '8px' }}>{p.gameStats?.enteredTokyoCount || 0}</td>
                    <td style={{ padding: '8px' }}>{p.gameStats?.startedTurnInTokyoCount || 0}</td>`
);

// Remove legend
content = content.replace(
  `<Legend />`,
  ``
);

fs.writeFileSync('frontend/src/GameOverScreen.tsx', content, 'utf8');
