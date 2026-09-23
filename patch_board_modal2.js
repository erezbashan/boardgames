const fs = require('fs');
const file = 'games/acquire/src/components/AcquireBoard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /if \(state\?\.phase === 'MergeResolution'\) \{/,
  'if (state?.phase === \'MergeResolution\' || state?.phase === \'ChooseMergeSurvivor\') {'
);

content = content.replace(
  /\{state\.phase === 'ChooseMergeSurvivor' && state\.pendingSurvivorChoice\?\.playerId === playerId && \(/,
  '{state.phase === \'ChooseMergeSurvivor\' && state.pendingSurvivorChoice?.playerId === playerId && showMergerModal && ('
);

fs.writeFileSync(file, content);
