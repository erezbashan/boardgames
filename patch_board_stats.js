const fs = require('fs');
const file = 'games/acquire/src/components/AcquireBoard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /import \{ useGame \} from '@erez\/boardgame-core';/,
  'import { useGame } from \'@erez/boardgame-core\';\nimport { AcquireStats } from \'./AcquireStats\';'
);

content = content.replace(
  /renderGameSpecificPlayerDetails=\{renderPlayerDetails\}/,
  'renderGameSpecificPlayerDetails={renderPlayerDetails}\n      renderGameSpecificStats={() => <AcquireStats gameState={state} />}'
);

fs.writeFileSync(file, content);
