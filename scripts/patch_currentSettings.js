const fs = require('fs');
let code = fs.readFileSync('games/king-of-tokyo/src/components/KotBoard.tsx', 'utf8');
code = code.replace(
  `    startingEnergy: settings?.startingEnergy || 0,
    activeCards: settings?.activeCards || []
  };`,
  `    startingEnergy: settings?.startingEnergy || 0,
    activeCards: settings?.activeCards || [],
    gameSpeed: settings?.gameSpeed || 'Normal',
    secondEditionTokyoRule: settings?.secondEditionTokyoRule || false
  };`
);
fs.writeFileSync('games/king-of-tokyo/src/components/KotBoard.tsx', code);
