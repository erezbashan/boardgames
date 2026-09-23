const fs = require('fs');
let code = fs.readFileSync('games/acquire/src/engine/engine.ts', 'utf8');

code = code.replace(
  /logs: \[\.\.\.state.logs, 'Game started!'\]/,
  `logs: [...state.logs, 'Game started!', \`--- 💼 \${updatedPlayers[0].name}'s Turn ---\`]`
);

fs.writeFileSync('games/acquire/src/engine/engine.ts', code);
