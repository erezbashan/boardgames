const fs = require('fs');
const file = 'games/acquire/src/engine/engine.ts';
let content = fs.readFileSync(file, 'utf8');

const oldCode = `    turnContext: { ...newState.turnContext, rankChange: undefined, lastPlacedTile: undefined }`;
const newCode = `    turnContext: { ...newState.turnContext, rankChange: undefined, lastPlacedTile: undefined, startOfTurnRanks: undefined }`;

content = content.replace(oldCode, newCode);
fs.writeFileSync(file, content);
