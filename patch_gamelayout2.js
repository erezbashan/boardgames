const fs = require('fs');
let code = fs.readFileSync('packages/boardgame-core/src/components/GameLayout.tsx', 'utf8');

code = code.replace(
  /payload: \{ settings: \{ \.\.\.gameState\.settings, gameSpeed: e\.target\.value \} \}/,
  'payload: { ...gameState.settings, gameSpeed: e.target.value }'
);

fs.writeFileSync('packages/boardgame-core/src/components/GameLayout.tsx', code);
