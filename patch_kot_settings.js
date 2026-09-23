const fs = require('fs');
let code = fs.readFileSync('games/king-of-tokyo/src/components/KotBoard.tsx', 'utf8');

code = code.replace(
  /      <div style=\{\{ display: 'flex', justifyContent: 'space-between', width: '300px', alignItems: 'center' \}\}>\n        <label style=\{\{ fontSize: '18px' \}\}>Game Speed:<\/label>\n        <select\n          value=\{currentSettings\.gameSpeed \|\| 'Normal'\}\n          onChange=\{e => dispatch\(\{ type: 'UPDATE_SETTINGS', payload: \{ \.\.\.currentSettings, gameSpeed: e\.target\.value \} \}\)\}\n          className="modern-input"\n          style=\{\{ width: '120px', display: 'inline-block' \}\}\n        >\n           <option value="Slow">Slow<\/option>\n           <option value="Normal">Normal<\/option>\n           <option value="Fast">Fast<\/option>\n        <\/select>\n      <\/div>/g,
  ''
);

fs.writeFileSync('games/king-of-tokyo/src/components/KotBoard.tsx', code);
