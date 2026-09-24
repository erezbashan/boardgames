const fs = require('fs');
const file = 'games/acquire/src/components/AcquireBoard.css';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /0% \{ transform: scale\(1\); box-shadow: 0 0 0px gold; \}\n  50% \{ transform: scale\(1\.3\); box-shadow: 0 0 20px gold; z-index: 10; border-radius: 4px; \}\n  100% \{ transform: scale\(1\); box-shadow: 0 0 5px gold; \}/,
  '0% { transform: scale(1); box-shadow: 0 0 0px gold; }\n  25% { transform: scale(1.4); box-shadow: 0 0 25px gold; z-index: 10; border-radius: 6px; }\n  50% { transform: scale(1); box-shadow: 0 0 5px gold; }\n  75% { transform: scale(1.4); box-shadow: 0 0 25px gold; z-index: 10; border-radius: 6px; }\n  100% { transform: scale(1); box-shadow: 0 0 10px gold; }'
);

content = content.replace(
  /animation: rankPop 1s cubic-bezier\(0\.175, 0\.885, 0\.32, 1\.275\) forwards;/,
  'animation: rankPop 2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;'
);

fs.writeFileSync(file, content);
