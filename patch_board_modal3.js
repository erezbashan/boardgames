const fs = require('fs');
const file = 'games/acquire/src/components/AcquireBoard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /if \(state\?\.phase === 'MergeResolution' \|\| state\?\.phase === 'ChooseMergeSurvivor'\) \{/,
  'if (state?.phase === \'MergeResolution\' || state?.phase === \'ChooseMergeSurvivor\' || state?.phase === \'FoundCorporation\') {'
);

content = content.replace(
  /\{state\.phase === 'FoundCorporation' && state\.pendingFounding\?\.playerId === playerId && \(/,
  '{state.phase === \'FoundCorporation\' && state.pendingFounding?.playerId === playerId && showMergerModal && ('
);

fs.writeFileSync(file, content);
