const fs = require('fs');
const file = 'games/acquire/src/components/AcquireBoard.tsx';
let content = fs.readFileSync(file, 'utf8');

// For MergeResolution
content = content.replace(
  /              \)\}\n            <\/div>\n          <\/div>\n        \)\}/,
  '              )}\n            </div>\n          </Modal>\n        )}'
);

fs.writeFileSync(file, content);
