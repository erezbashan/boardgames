const fs = require('fs');
const file = 'games/acquire/src/engine/engine.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /sharesBoughtThisTurn: 0/,
  'sharesBoughtThisTurn: 0,\n    turnContext: { ...newState.turnContext, rankChange: undefined, lastPlacedTile: undefined }'
);

fs.writeFileSync(file, content);
