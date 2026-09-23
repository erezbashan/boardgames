const fs = require('fs');
const file = 'games/acquire/src/components/AcquireBoard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /import \{ GameLayout, useGameContext, AnimatedValue \} from '@erez\/boardgame-core';/,
  'import { GameLayout, useGameContext, AnimatedValue } from \'@erez/boardgame-core\';\nimport { AcquireStats } from \'./AcquireStats\';'
);

fs.writeFileSync(file, content);
