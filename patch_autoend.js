const fs = require('fs');
const file = 'games/acquire/src/engine/engine.ts';
let content = fs.readFileSync(file, 'utf8');

const oldCode = `  return newState;
}`;

const newCode = `  if (shouldAutoEndTurn(newState)) {
    return endTurn(newState);
  }

  return newState;
}`;

// Make sure we only replace the ONE at the end of buyStock.
// buyStock is the ONLY function that ends with "return newState;\n}" right after the rank change logic?
// Wait, we can just use a precise regex.

const regex = /\s*return newState;\n\}/;
// Actually, let's just do a string replacement on the last part of buyStock.
// Wait, buyStock has:
//     if (msg) {
//       newState.logs.push(msg);
//       newState.turnContext = { ...newState.turnContext, rankChange: { corp: corpName, triggerPlayerId: playerId } };
//     }
//   }
// 
//   return newState;
// }

content = content.replace(
  /(\s*newState\.turnContext = \{ \.\.\.newState\.turnContext, rankChange: \{ corp: corpName, triggerPlayerId: playerId \} \};\n\s*\}\n\s*\})\n\n\s*return newState;\n\}/,
  "$1\n\n  if (shouldAutoEndTurn(newState)) {\n    return endTurn(newState);\n  }\n\n  return newState;\n}"
);

fs.writeFileSync(file, content);
