const fs = require('fs');
const file = 'games/acquire/src/engine/engine.ts';
let content = fs.readFileSync(file, 'utf8');

const oldLogic = `  if (canEndGame(newState)) {
    const leader = Object.values(newState.players).reduce((prev, current) => {
      return (getPlayerFinancials(newState, prev.id).netWorth > getPlayerFinancials(newState, current.id).netWorth) ? prev : current;
    });
    
    if (leader.id === cp.id) {
      newState.phase = 'GameOver';
      newState.logs.push(\`Game Over! \${cp.name} ends the game and wins with a net worth of $\${getPlayerFinancials(newState, cp.id).netWorth.toLocaleString()}!\`);
      return newState;
    }
  }`;

const newLogic = `  if (canEndGame(newState)) {
    const leader = Object.values(newState.players).reduce((prev, current) => {
      return (getPlayerFinancials(newState, prev.id).netWorth > getPlayerFinancials(newState, current.id).netWorth) ? prev : current;
    });
    
    newState.phase = 'GameOver';
    newState.status = 'Finished';
    newState.winnerId = leader.id;
    newState.logs.push(\`Game Over! The game ends because conditions are met. \${leader.name} wins with a net worth of $\${getPlayerFinancials(newState, leader.id).netWorth.toLocaleString()}!\`);
    return newState;
  }`;

content = content.replace(oldLogic, newLogic);

// Also check if there's another canEndGame check further down (for np.id)
const oldLogic2 = `  if (canEndGame(newState)) {
    const leader = Object.values(newState.players).reduce((prev, current) => {
      return (getPlayerFinancials(newState, prev.id).netWorth > getPlayerFinancials(newState, current.id).netWorth) ? prev : current;
    });
    
    if (leader.id === np.id) {
      newState.phase = 'GameOver';
      newState.logs.push(\`Game Over! \${np.name} starts their turn, sees they are in the lead, and ends the game with a net worth of $\${getPlayerFinancials(newState, np.id).netWorth.toLocaleString()}!\`);
      return newState;
    }
  }`;

const newLogic2 = `  if (canEndGame(newState)) {
    const leader = Object.values(newState.players).reduce((prev, current) => {
      return (getPlayerFinancials(newState, prev.id).netWorth > getPlayerFinancials(newState, current.id).netWorth) ? prev : current;
    });
    
    newState.phase = 'GameOver';
    newState.status = 'Finished';
    newState.winnerId = leader.id;
    newState.logs.push(\`Game Over! The game ends because conditions are met. \${leader.name} wins with a net worth of $\${getPlayerFinancials(newState, leader.id).netWorth.toLocaleString()}!\`);
    return newState;
  }`;

content = content.replace(oldLogic2, newLogic2);

fs.writeFileSync(file, content);
