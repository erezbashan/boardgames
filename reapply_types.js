const fs = require('fs');
const path = 'games/acquire/src/engine/types.ts';
let content = fs.readFileSync(path, 'utf8');
if (!content.includes('turnContext?: any;')) {
  content = content.replace(
    /history\?: Array<any>;/,
    'history?: Array<any>;\n  turnContext?: any;'
  );
  fs.writeFileSync(path, content);
}
