const fs = require('fs');
let code = fs.readFileSync('games/king-of-tokyo/src/components/KotBoard.tsx', 'utf8');

code = code.replace(/className="modern-input" disabled=\{status !== 'Lobby'\}/g, 'className="modern-input"');

code = code.replace(
  '          className="modern-input"\n          style={{ width: \'120px\', display: \'inline-block\' }}\n        >\n           <option value="Slow">',
  '          disabled={status !== \'Lobby\'}\n          className="modern-input"\n          style={{ width: \'120px\', display: \'inline-block\' }}\n        >\n           <option value="Slow">'
);

fs.writeFileSync('games/king-of-tokyo/src/components/KotBoard.tsx', code);
