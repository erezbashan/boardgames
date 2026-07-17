const fs = require('fs');

let shared = fs.readFileSync('shared/src/index.ts', 'utf8');
shared = shared.replace(
  `    enteredTokyoCount: number;\n    startedTurnInTokyoCount: number;\n    energyGained: number;\n    healingGained: number;`,
  `    energyGained: number;\n    healingGained: number;\n    vpFromDice?: number;\n    vpFromEnteringTokyo?: number;\n    vpFromStartingTokyo?: number;\n    vpFromOther?: number;`
);

fs.writeFileSync('shared/src/index.ts', shared, 'utf8');

