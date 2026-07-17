const fs = require('fs');
let content = fs.readFileSync('backend/src/index.ts', 'utf8');

// Fix energyGained
content = content.replace(
  `  if (results.energy > 0) {
    p.energy += results.energy;`,
  `  if (results.energy > 0) {
    p.energy += results.energy;
    if (p.gameStats) p.gameStats.energyGained += results.energy;`
);

// Fix healingGained
content = content.replace(
  `    p.health = Math.min(p.maxHealth || 10, p.health + actualHeal);
    game.logs.push(\`\${p.name} healed \${actualHeal} ❤️.\`);`,
  `    p.health = Math.min(p.maxHealth || 10, p.health + actualHeal);
    if (p.gameStats) p.gameStats.healingGained += actualHeal;
    game.logs.push(\`\${p.name} healed \${actualHeal} ❤️.\`);`
);

// Fix entering Tokyo count (wait, did I already apply it? Let's check if enteredTokyoCount was patched)
// Actually I'll use replace_file_content if I need to. Let's just run this string replace first.

fs.writeFileSync('backend/src/index.ts', content, 'utf8');
