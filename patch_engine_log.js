const fs = require('fs');
let code = fs.readFileSync('games/acquire/src/engine/engine.ts', 'utf8');

code = code.replace(
  /  return \{\\n    \.\.\.newState,\\n    currentPlayerIndex: nextPlayerIndex,\\n    phase: 'PlayTile',\\n    sharesBoughtThisTurn: 0\\n  \};/,
  `  const nextId = newState.playerOrder[nextPlayerIndex];
  const nextPlayerName = newState.players[nextId].name;
  return {
    ...newState,
    currentPlayerIndex: nextPlayerIndex,
    phase: 'PlayTile',
    sharesBoughtThisTurn: 0,
    logs: [...newState.logs, \`--- 💼 \${nextPlayerName}'s Turn ---\`]
  };`
);

fs.writeFileSync('games/acquire/src/engine/engine.ts', code);
