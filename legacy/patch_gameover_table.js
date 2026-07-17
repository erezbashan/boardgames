const fs = require('fs');
let content = fs.readFileSync('frontend/src/GameOverScreen.tsx', 'utf8');

// Add column headers
content = content.replace(
  `<th style={{ padding: '8px' }}>Total Damage Dealt</th>`,
  `<th style={{ padding: '8px', textAlign: 'right' }}>Total Damage Dealt</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Players Killed</th>`
);

// Add text-align right to other th
content = content.replace(
  `<th style={{ padding: '8px' }}>Cards Bought</th>
                <th style={{ padding: '8px' }}>Energy Spent</th>
                <th style={{ padding: '8px' }}>Energy Gained</th>
                <th style={{ padding: '8px' }}>Total Healing</th>
                <th style={{ padding: '8px' }}>Times Entered Tokyo</th>
                <th style={{ padding: '8px' }}>Times Started in Tokyo</th>`,
  `<th style={{ padding: '8px', textAlign: 'right' }}>Cards Bought</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Energy Spent</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Energy Gained</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Total Healing</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Times Entered Tokyo</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Times Started in Tokyo</th>`
);

// Add table data
content = content.replace(
  `<td style={{ padding: '8px' }}>{p.gameStats?.damageDealt || 0}</td>`,
  `<td style={{ padding: '8px', textAlign: 'right' }}>{p.gameStats?.damageDealt || 0}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{p.gameStats?.playersKilled || 0}</td>`
);

// Add text-align right to other td
content = content.replace(
  `<td style={{ padding: '8px' }}>{p.gameStats?.cardsBought || 0}</td>
                    <td style={{ padding: '8px' }}>{p.gameStats?.energySpent || 0}</td>
                    <td style={{ padding: '8px' }}>{p.gameStats?.energyGained || 0}</td>
                    <td style={{ padding: '8px' }}>{p.gameStats?.healingGained || 0}</td>
                    <td style={{ padding: '8px' }}>{p.gameStats?.enteredTokyoCount || 0}</td>
                    <td style={{ padding: '8px' }}>{p.gameStats?.startedTurnInTokyoCount || 0}</td>`,
  `<td style={{ padding: '8px', textAlign: 'right' }}>{p.gameStats?.cardsBought || 0}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{p.gameStats?.energySpent || 0}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{p.gameStats?.energyGained || 0}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{p.gameStats?.healingGained || 0}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{p.gameStats?.enteredTokyoCount || 0}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{p.gameStats?.startedTurnInTokyoCount || 0}</td>`
);

// Graph truncation logic
content = content.replace(
  `for (const id of playerIds) {
        const h = gameState.history.find(x => x.turnNumber === turn && x.playerId === id);
        if (h) {
          turnData[\`\${gameState.players[id].name} VP\`] = h.vp;
          turnData[\`\${gameState.players[id].name} Health\`] = h.health;
          turnData[\`\${gameState.players[id].name} Energy\`] = h.energy;
        }
      }`,
  `for (const id of playerIds) {
        const p = gameState.players[id];
        // Graph Truncation: don't plot points past the turn they died
        if (p.health <= 0 && p.gameStats?.turnDied && turn > p.gameStats.turnDied) {
          continue;
        }
        const h = gameState.history.find(x => x.turnNumber === turn && x.playerId === id);
        if (h) {
          turnData[\`\${p.name} VP\`] = h.vp;
          turnData[\`\${p.name} Health\`] = h.health;
          turnData[\`\${p.name} Energy\`] = h.energy;
        }
      }`
);

fs.writeFileSync('frontend/src/GameOverScreen.tsx', content, 'utf8');
