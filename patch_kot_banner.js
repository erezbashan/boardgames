const fs = require('fs');
const file = 'games/king-of-tokyo/src/components/KotBoard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /\{status === 'Finished' && \([\s\S]*?<\/div>\n            \)\}/,
  ''
);

fs.writeFileSync(file, content);
