const fs = require('fs');
const file = 'games/acquire/src/engine/engine.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /if \(leader\.id === np\.id\) \{[\s\S]*?phase: 'GameOver',[\s\S]*?\}/g,
  `
    newState.phase = 'GameOver';
    newState.status = 'Finished';
    newState.winnerId = leader.id;
    newState.logs.push(\`Game Over! The game ends because conditions are met. \${leader.name} wins with a net worth of $\${getPlayerFinancials(newState, leader.id).netWorth.toLocaleString()}!\`);
    return newState;
  `
);

fs.writeFileSync(file, content);
