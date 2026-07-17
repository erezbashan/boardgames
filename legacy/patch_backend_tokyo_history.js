const fs = require('fs');

let shared = fs.readFileSync('shared/src/index.ts', 'utf8');
shared = shared.replace(
  `  energy: number;`,
  `  energy: number;\n  inTokyo?: boolean;`
);
fs.writeFileSync('shared/src/index.ts', shared, 'utf8');

let backend = fs.readFileSync('backend/src/index.ts', 'utf8');
backend = backend.replace(
  `      vp: p.victoryPoints,
      health: Math.max(0, p.health),
      energy: p.energy`,
  `      vp: p.victoryPoints,
      health: Math.max(0, p.health),
      energy: p.energy,
      inTokyo: p.inTokyo`
);
fs.writeFileSync('backend/src/index.ts', backend, 'utf8');

