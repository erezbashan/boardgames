const fs = require('fs');
const file = 'games/acquire/src/components/AcquireBoard.css';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /animation: placePop 1s cubic-bezier\(0.175, 0.885, 0.32, 1.275\) forwards;/,
  'animation: placePop 2s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite;'
);

fs.writeFileSync(file, content);
