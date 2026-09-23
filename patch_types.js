const fs = require('fs');
let code = fs.readFileSync('packages/boardgame-core/src/engine/types.ts', 'utf8');

code = code.replace(
  "| { type: 'UPDATE_SETTINGS', payload: { settings: any } };",
  "| { type: 'UPDATE_SETTINGS', payload: any };"
);

fs.writeFileSync('packages/boardgame-core/src/engine/types.ts', code);
