const fs = require('fs');
const file = 'games/acquire/src/engine/engine.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /sharesBoughtThisTurn: 0,\n    turnContext: \{ \.\.\.newState\.turnContext, rankChange: undefined, lastPlacedTile: undefined \}/,
  'sharesBoughtThisTurn: 0'
);

fs.writeFileSync(file, content);
