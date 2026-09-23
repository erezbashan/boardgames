const fs = require('fs');
const file = 'games/acquire/src/components/AcquireBoard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /<button \n                    style=\{\{ marginTop: '10px' \}\}/,
  '<button \n                    className="btn primary"\n                    style={{ marginTop: \'10px\' }}'
);

content = content.replace(
  /<button onClick=\{\(\) => dispatch\(\{ type: 'RESOLVE_MERGE_STOCKS', payload: \{ playerId, sell: 0, trade: 0, keep: 0 \} \}\)\}>Continue<\/button>/,
  '<button className="btn primary" onClick={() => dispatch({ type: \'RESOLVE_MERGE_STOCKS\', payload: { playerId, sell: 0, trade: 0, keep: 0 } })}>Continue</button>'
);

content = content.replace(
  /<button onClick=\{\(\) => setSelectedCorp\(null\)\}\n                  style=\{\{ display: 'block', width: '100%', marginTop: '15px' \}\}>\n            Close\n          <\/button>/,
  '<button className="btn primary" onClick={() => setSelectedCorp(null)}\n                  style={{ display: \'block\', width: \'100%\', marginTop: \'15px\' }}>\n            Close\n          </button>'
);

fs.writeFileSync(file, content);
