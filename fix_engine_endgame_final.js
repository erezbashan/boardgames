const fs = require('fs');
const file = 'games/acquire/src/engine/engine.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. First remove the `---` pushes
content = content.replace(/newState\.logs\.push\(`---`\);\n/g, '');

// 2. Fix the first canEndGame check inside endTurn
const firstCheck = `  if (canEndGame(newState)) {
    const leader = Object.values(newState.players).reduce((prev, current) => {
      return (getPlayerFinancials(newState, prev.id).netWorth > getPlayerFinancials(newState, current.id).netWorth) ? prev : current;
    });
    
    if (leader.id === cp.id) {
      newState.phase = 'GameOver';
      newState.logs.push(\`Game Over! \${cp.name} ends the game and wins with a net worth of $\${getPlayerFinancials(newState, cp.id).netWorth.toLocaleString()}!\`);
      return newState;
    }
  }`;
  
const firstCheckFix = `  if (canEndGame(newState)) {
    const leader = Object.values(newState.players).reduce((prev, current) => {
      return (getPlayerFinancials(newState, prev.id).netWorth > getPlayerFinancials(newState, current.id).netWorth) ? prev : current;
    });
    
    newState.phase = 'GameOver';
    newState.status = 'Finished';
    newState.winnerId = leader.id;
    newState.logs.push(\`Game Over! The game ends because conditions are met. \${leader.name} wins with a net worth of $\${getPlayerFinancials(newState, leader.id).netWorth.toLocaleString()}!\`);
    return newState;
  }`;

content = content.replace(firstCheck, firstCheckFix);

// 3. Fix the second canEndGame check inside endTurn
const secondCheck = `  // Check if next player should immediately end the game
  if (canEndGame(newState)) {
    const leader = Object.values(newState.players).reduce((prev, current) => {
      return (getPlayerFinancials(newState, prev.id).netWorth > getPlayerFinancials(newState, current.id).netWorth) ? prev : current;
    });
    
    if (leader.id === np.id) {
      newState.logs.push(\`Game Over! \${np.name} starts their turn, sees they are in the lead, and ends the game with a net worth of $\${getPlayerFinancials(newState, np.id).netWorth.toLocaleString()}!\`);
      return {
        ...newState,
        currentPlayerIndex: nextPlayerIndex,
        status: 'Finished',
        winnerId: leader.id,
        phase: 'GameOver',
      };
    }
  }`;

const secondCheckFix = `  // Check if next player should immediately end the game
  if (canEndGame(newState)) {
    const leader = Object.values(newState.players).reduce((prev, current) => {
      return (getPlayerFinancials(newState, prev.id).netWorth > getPlayerFinancials(newState, current.id).netWorth) ? prev : current;
    });
    
    newState.phase = 'GameOver';
    newState.status = 'Finished';
    newState.winnerId = leader.id;
    newState.logs.push(\`Game Over! The game ends because conditions are met. \${leader.name} wins with a net worth of $\${getPlayerFinancials(newState, leader.id).netWorth.toLocaleString()}!\`);
    return newState;
  }`;

content = content.replace(secondCheck, secondCheckFix);

fs.writeFileSync(file, content);
