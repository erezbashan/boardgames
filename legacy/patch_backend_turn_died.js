const fs = require('fs');
let content = fs.readFileSync('backend/src/index.ts', 'utf8');

content = content.replace(
  `          if (other.health <= 0) {
            modifierLogs.push(\`💀 \${other.name} was killed!\`);
            if (p.gameStats) {
              p.gameStats.playersKilled = (p.gameStats.playersKilled || 0) + 1;
            }
          }`,
  `          if (other.health <= 0) {
            modifierLogs.push(\`💀 \${other.name} was killed!\`);
            if (p.gameStats) {
              p.gameStats.playersKilled = (p.gameStats.playersKilled || 0) + 1;
            }
            if (other.gameStats) {
              other.gameStats.turnDied = game.turnCount;
            }
          }`
);

fs.writeFileSync('backend/src/index.ts', content, 'utf8');
