const fs = require('fs');
const file = 'games/acquire/src/components/AcquireBoard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /<div key=\{cName\} style=\{\{ \n                 display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',/,
  '<div key={cName} className={state.turnContext?.rankChange?.corp === cName && (isGold || isSilver) ? \'rank-change-pop\' : \'\'} style={{ \n                 display: \'flex\', flexDirection: \'column\', alignItems: \'center\', justifyContent: \'center\','
);

fs.writeFileSync(file, content);
