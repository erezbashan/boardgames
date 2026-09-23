const fs = require('fs');
const file = 'games/acquire/src/engine/reducer.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /resolveMergeStocks \n\} from '.\/engine';/,
  'resolveMergeStocks, getPlayerFinancials, canEndGame \n} from \'./engine\';'
);

fs.writeFileSync(file, content);
