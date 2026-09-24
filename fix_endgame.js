const fs = require('fs');
const file = 'games/acquire/src/engine/engine.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /if \(canEndGame\(newState\)\) \{\n\s*const leader = Object\.values\(newState\.players\)\.reduce\(\(prev, current\) => \{\n\s*return \(getPlayerFinancials\(newState, prev\.id\)\.netWorth > getPlayerFinancials\(newState, current\.id\)\.netWorth\) \? prev : current;\n\s*\}\);\n\s*newState\.phase = 'GameOver';/g;

const replacement = `if (canEndGame(newState)) {
    const leader = Object.values(newState.players).reduce((prev, current) => {
      return (getPlayerFinancials(newState, prev.id).netWorth > getPlayerFinancials(newState, current.id).netWorth) ? prev : current;
    });
    
    if (leader.id === cpId) {
      newState.phase = 'GameOver';`;

// Wait, I need to make sure I don't break the brace matching
