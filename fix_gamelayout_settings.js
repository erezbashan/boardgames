const fs = require('fs');
const file = 'packages/boardgame-core/src/components/GameLayout.tsx';
let content = fs.readFileSync(file, 'utf8');

// Always show the Settings button if the game supports it, regardless of whether there are additional custom settings
content = content.replace(
  /\{\(status === 'Lobby' \|\| status === 'Playing'\) && settings && \(/g,
  '{(status === \'Lobby\' || status === \'Playing\') && ('
);

// In Lobby, GameLayout renders General settings. Let's make sure it's visible. 
// Wait, the Lobby UI renders `settings` inline on the board: `{status === 'Lobby' && settings}`
// Instead of inline, maybe they just want the button? 
// The button is in the top bar. The inline settings in Lobby were for convenience. 
// Actually, let's leave `{status === 'Lobby' && settings}` alone, the button is enough.
fs.writeFileSync(file, content);
