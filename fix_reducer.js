const fs = require('fs');
let code = fs.readFileSync('packages/boardgame-core/src/engine/baseReducer.ts', 'utf-8');

if (!code.includes("BOT_NAMES")) {
    code = "import { BOT_NAMES } from './types';\n" + code;
}

const target = `const { playerId, name, isBot, botStrategy } = action.payload;`;
const replacement = `let { playerId, name, isBot, botStrategy } = action.payload;
      const existingNames = Object.values(state.players).map((p: any) => p.name);
      if (existingNames.includes(name)) {
          if (isBot) {
              const available = BOT_NAMES.filter(n => !existingNames.includes(n));
              if (available.length > 0) {
                  name = available[Math.floor(Math.random() * available.length)];
              } else {
                  let c = 2; while (existingNames.includes(name + " " + c)) c++; name = name + " " + c;
              }
          } else {
              let c = 2; while (existingNames.includes(name + " " + c)) c++; name = name + " " + c;
          }
      }`;
code = code.replace(target, replacement);
fs.writeFileSync('packages/boardgame-core/src/engine/baseReducer.ts', code);
