const fs = require('fs');
const path = 'games/acquire/src/components/AcquireBoard.tsx';
let content = fs.readFileSync(path, 'utf8');

const turnLogic = `  let activeId = state.playerOrder[state.currentPlayerIndex];
  if (state.phase === 'FoundCorporation' && state.pendingFounding) activeId = state.pendingFounding.playerId;
  if (state.phase === 'ChooseMergeSurvivor' && state.pendingSurvivorChoice) activeId = state.pendingSurvivorChoice.playerId;
  if (state.phase === 'MergeResolution' && state.pendingMerge) activeId = state.playerOrder[state.pendingMerge.playerResolutionIndex];
  
  const isMyTurn = activeId === playerId;`;

content = content.replace(
  /const isMyTurn = state\.playerOrder\[state\.currentPlayerIndex\] === playerId;/,
  turnLogic
);

fs.writeFileSync(path, content);
