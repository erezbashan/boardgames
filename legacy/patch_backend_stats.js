const fs = require('fs');
let content = fs.readFileSync('backend/src/index.ts', 'utf8');

// Move hitTokyoPlayer logic inside actualDmg > 0
content = content.replace(
  `        } else if (armor > 0 && dmg > 0) {
           modifierLogs.push(\`🛡️ \${other.name}'s Armor completely blocked the attack!\`);
        }
        
        if (other.inTokyo) {
          hitTokyoPlayer = true;
          playerInTokyo = other;
        }`,
  `        } else if (armor > 0 && dmg > 0) {
           modifierLogs.push(\`🛡️ \${other.name}'s Armor completely blocked the attack!\`);
        }
        
        if (other.inTokyo && actualDmg > 0) {
          hitTokyoPlayer = true;
          playerInTokyo = other;
        }`
);

// Add playersKilled tracking
content = content.replace(
  `          if (other.health <= 0) {
            modifierLogs.push(\`💀 \${other.name} was killed!\`);
          }`,
  `          if (other.health <= 0) {
            modifierLogs.push(\`💀 \${other.name} was killed!\`);
            if (p.gameStats) {
              p.gameStats.playersKilled = (p.gameStats.playersKilled || 0) + 1;
            }
          }`
);

fs.writeFileSync('backend/src/index.ts', content, 'utf8');
