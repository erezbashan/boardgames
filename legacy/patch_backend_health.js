const fs = require('fs');
let content = fs.readFileSync('backend/src/index.ts', 'utf8');

content = content.replace(
  `        p.color = PLAYER_COLORS[index % PLAYER_COLORS.length];
        p.gameStats = {`,
  `        p.color = PLAYER_COLORS[index % PLAYER_COLORS.length];
        p.health = game.settings?.startingHealth || 10;
        p.gameStats = {`
);

fs.writeFileSync('backend/src/index.ts', content, 'utf8');
