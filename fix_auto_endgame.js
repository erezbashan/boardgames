const fs = require('fs');
const file = 'games/acquire/src/engine/reducer.ts';
let content = fs.readFileSync(file, 'utf8');

const importReplacement = `import { playTile, foundCorporation, buyStock, endTurn, chooseMergeSurvivor, resolveMergeStocks, getPlayerFinancials, canEndGame } from './engine';`;
content = content.replace(/import \{ playTile, foundCorporation, buyStock, endTurn, chooseMergeSurvivor, resolveMergeStocks \} from '\.\/engine';/, importReplacement);

const checkEndGameLogic = `
  // Check global end game conditions immediately after action completes
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
  }

  // Skip delay in simulations`;

content = content.replace(/\/\/ Skip delay in simulations/, checkEndGameLogic);

fs.writeFileSync(file, content);
