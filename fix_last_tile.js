const fs = require('fs');
const file = 'games/acquire/src/engine/engine.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const newState = \{ \.\.\.state, board: newBoard \};/,
  'const newState = { ...state, board: newBoard, turnContext: { ...state.turnContext, lastPlacedTile: tileId } };'
);

fs.writeFileSync(file, content);
