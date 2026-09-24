const fs = require('fs');
const file = 'games/acquire/src/engine/reducer.ts';
let content = fs.readFileSync(file, 'utf8');

const oldLogic = `  // Check global end game conditions immediately after action completes
  if (newState.status === 'Playing' && canEndGame(newState)) {
    const leader = Object.values(newState.players).reduce((prev, current) => {
      return (getPlayerFinancials(newState, prev.id).netWorth > getPlayerFinancials(newState, current.id).netWorth) ? prev : current;
    });
    newState = {
      ...newState,
      phase: 'GameOver',
      status: 'Finished',
      winnerId: leader.id,
      logs: [...newState.logs, \`Game Over! The game ends immediately as conditions are met. \${leader.name} wins with a net worth of $\${getPlayerFinancials(newState, leader.id).netWorth.toLocaleString()}!\`]
    };
  }`;

const newLogic = `  // Check global end game conditions immediately after action completes
  if (newState.status === 'Playing' && canEndGame(newState)) {
    const leader = Object.values(newState.players).reduce((prev, current) => {
      return (getPlayerFinancials(newState, prev.id).netWorth > getPlayerFinancials(newState, current.id).netWorth) ? prev : current;
    });
    
    // Only auto-end the game if the CURRENT player is the leader
    // This allows non-leaders to continue playing and buying stocks to potentially catch up
    const currentPlayerId = newState.playerOrder[newState.currentPlayerIndex];
    if (leader.id === currentPlayerId) {
      newState = {
        ...newState,
        phase: 'GameOver',
        status: 'Finished',
        winnerId: leader.id,
        logs: [...newState.logs, \`Game Over! \${leader.name} secures the lead while conditions are met, ending the game! \${leader.name} wins with a net worth of $\${getPlayerFinancials(newState, leader.id).netWorth.toLocaleString()}!\`]
      };
    }
  }`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync(file, content);
