const fs = require('fs');
let code = fs.readFileSync('games/king-of-tokyo/src/engine/types.ts', 'utf8');

code = code.replace(
  `  settings: {
    maxHealth: number;
    maxVp: number;
    cardsPerType: number;
    startingEnergy: number;
    activeCards: string[];
  };`,
  `  settings: {
    maxHealth: number;
    maxVp: number;
    cardsPerType: number;
    startingEnergy: number;
    activeCards: string[];
    gameSpeed?: 'Fast' | 'Normal' | 'Slow';
    secondEditionTokyoRule?: boolean;
  };`
);

code = code.replace(
  `    startingEnergy: 0,
    activeCards: Object.keys(CARD_REGISTRY)
  },`,
  `    startingEnergy: 0,
    activeCards: Object.keys(CARD_REGISTRY),
    gameSpeed: 'Normal',
    secondEditionTokyoRule: false
  },`
);

fs.writeFileSync('games/king-of-tokyo/src/engine/types.ts', code);
