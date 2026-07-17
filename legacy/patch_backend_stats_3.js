const fs = require('fs');
let backend = fs.readFileSync('backend/src/index.ts', 'utf8');

backend = backend.replace(
  `if (p.gameStats) p.gameStats.enteredTokyoCount += 1;`,
  `if (p.gameStats) p.gameStats.vpFromEnteringTokyo = (p.gameStats.vpFromEnteringTokyo || 0) + 1;`
);

fs.writeFileSync('backend/src/index.ts', backend, 'utf8');
