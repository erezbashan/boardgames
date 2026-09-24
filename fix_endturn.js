const fs = require('fs');
const file = 'games/acquire/src/engine/engine.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /currentPlayerIndex: nextPlayerIndex,\n    phase: 'PlayTile',\n    sharesBoughtThisTurn: 0/,
  'currentPlayerIndex: nextPlayerIndex,\n    phase: \'PlayTile\',\n    sharesBoughtThisTurn: 0,\n    turnContext: { ...newState.turnContext, rankChange: undefined, lastPlacedTile: undefined }'
);

fs.writeFileSync(file, content);
