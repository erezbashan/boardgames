const fs = require('fs');
const file = 'games/acquire/src/engine/engine.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /phase: 'GameOver',/,
  'status: \'Finished\',\n        winnerId: leader.id,\n        phase: \'GameOver\','
);

fs.writeFileSync(file, content);
