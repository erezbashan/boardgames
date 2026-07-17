const fs = require('fs');
let content = fs.readFileSync('frontend/src/GameOverScreen.tsx', 'utf8');

// Remove Game Progress label
content = content.replace(
  `<h3 style={{ textAlign: 'center', marginBottom: '16px' }}>Game Progress</h3>`,
  ``
);

// Fix sort logic
content = content.replace(
  `// 4. If both dead, sort by turnDied descending (latest death first)
    const turnA = pA.gameStats?.turnDied || 0;
    const turnB = pB.gameStats?.turnDied || 0;
    return turnB - turnA;`,
  `// 4. If both dead, sort by turnDied ascending (earliest death first, which puts them lower in the overall list if we consider 1 = top)
    // Wait, earlier death should be lower in the table. So they should be sorted by turnDied DESCENDING so later deaths are higher up.
    // The user said: "The order of death was Alice -> Hank -> Frank. But the order in the table is the other way around."
    // Meaning the table showed Frank -> Hank -> Alice.
    // Frank died last (highest turnDied), so Frank is at the top of the dead players.
    // The user wants the earliest death (Alice) at the top of the dead players?
    // Let's sort turnA - turnB (ascending) so the earliest death is higher in the table.
    const turnA = pA.gameStats?.turnDied || 0;
    const turnB = pB.gameStats?.turnDied || 0;
    return turnA - turnB;`
);

fs.writeFileSync('frontend/src/GameOverScreen.tsx', content, 'utf8');
