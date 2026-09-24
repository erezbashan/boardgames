const fs = require('fs');
const file = 'games/acquire/src/engine/engine.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /if \(canEndGame\(newState\)\) \{\n\s*const leader = Object\.values\(newState\.players\)\.reduce\(\(prev, current\) => \{\n\s*return \(getPlayerFinancials\(newState, prev\.id\)\.netWorth > getPlayerFinancials\(newState, current\.id\)\.netWorth\) \? prev : current;\n\s*\}\);\n\s*newState\.phase = 'GameOver';\n\s*newState\.status = 'Finished';\n\s*newState\.winnerId = leader\.id;\n\s*newState\.logs\.push\(`Game Over! The game ends because conditions are met. \$\{leader\.name\} wins with a net worth of \$\{getPlayerFinancials\(newState, leader\.id\)\.netWorth\.toLocaleString\(\)\}!`\);\n\s*return newState;\n\s*\}/;

const replacement = `if (canEndGame(newState)) {
    const leader = Object.values(newState.players).reduce((prev, current) => {
      return (getPlayerFinancials(newState, prev.id).netWorth > getPlayerFinancials(newState, current.id).netWorth) ? prev : current;
    });
    
    if (leader.id === cpId) {
      newState.phase = 'GameOver';
      newState.status = 'Finished';
      newState.winnerId = leader.id;
      newState.logs.push(\`Game Over! \${cp.name} sees they are in the lead, and ends the game with a net worth of $\${getPlayerFinancials(newState, leader.id).netWorth.toLocaleString()}!\`);
      return newState;
    }
  }`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
