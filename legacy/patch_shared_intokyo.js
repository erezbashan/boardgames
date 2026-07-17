const fs = require('fs');

let shared = fs.readFileSync('shared/src/index.ts', 'utf8');

shared = shared.replace(
  `  energy: number;\n  inTokyo?: boolean;\n  inTokyo: boolean;`,
  `  energy: number;\n  inTokyo: boolean;`
);

fs.writeFileSync('shared/src/index.ts', shared, 'utf8');
