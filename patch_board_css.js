const fs = require('fs');
const file = 'games/acquire/src/components/AcquireBoard.css';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /\.board\.glass \{/,
  ".board.glass {\n  position: relative;"
);

fs.writeFileSync(file, content);
