const fs = require('fs');
const path = 'packages/boardgame-core/src/components/GameLayout.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /<div className="game-stage-area" style=\{\{ overflowY: status === 'Lobby' \? 'auto' : 'hidden' \}\}>/,
  '<div className="game-stage-area" style={{ flex: 100 - bottomAreaRatio, overflowY: status === \'Lobby\' ? \'auto\' : \'hidden\' }}>'
);

fs.writeFileSync(path, content);
