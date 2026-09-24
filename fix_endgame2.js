const fs = require('fs');
const file = 'games/acquire/src/engine/engine.ts';
let content = fs.readFileSync(file, 'utf8');

const oldCode = `  if (canEndGame(newState)) {
    const leader = Object.values(newState.players).reduce((prev, current) => {
      return (getPlayerFinancials(newState, prev.id).netWorth > getPlayerFinancials(newState, current.id).netWorth) ? prev : current;
    });
    
    newState.phase = 'GameOver';
    newState.status = 'Finished';
    newState.winnerId = leader.id;
    newState.logs.push(\`Game Over! The game ends because conditions are met. \${leader.name} wins with a net worth of $\${getPlayerFinancials(newState, leader.id).netWorth.toLocaleString()}!\`);
    return newState;
  }`;

const newCode = `  if (canEndGame(newState)) {
    const leader = Object.values(newState.players).reduce((prev, current) => {
      return (getPlayerFinancials(newState, prev.id).netWorth > getPlayerFinancials(newState, current.id).netWorth) ? prev : current;
    });
    
    if (leader.id === cpId) {
      newState.phase = 'GameOver';
      newState.status = 'Finished';
      newState.winnerId = leader.id;
      newState.logs.push(\`Game Over! The game ends because conditions are met. \${leader.name} wins with a net worth of $\${getPlayerFinancials(newState, leader.id).netWorth.toLocaleString()}!\`);
      return newState;
    }
  }`;

content = content.replace(oldCode, newCode);
fs.writeFileSync(file, content);
