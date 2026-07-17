const fs = require('fs');
let content = fs.readFileSync('backend/src/index.ts', 'utf8');

// Energy Hoarder
content = content.replace(
  `  if (results.energy > 0) {
    p.energy += results.energy;`,
  `  if (results.energy > 0) {
    if (p.cards.some(c => c.effect?.energyHoarder)) {
      results.energy += 1;
      game.logs.push(\`\${p.name} gained +1 extra ⚡ from Energy Hoarder!\`);
    }
    p.energy += results.energy;`
);

// Regeneration
content = content.replace(
  `    let actualHeal = 0;
    if (healsRemaining > 0 && !p.inTokyo) {`,
  `    let actualHeal = 0;
    if (healsRemaining > 0 && !p.inTokyo) {
      if (p.cards.some(c => c.effect?.regeneration)) {
        healsRemaining += 1;
        game.logs.push(\`\${p.name} heals +1 extra ❤️ from Regeneration!\`);
      }`
);

// Evade and Jetpack and Parasitic and Alpha Monster and Shrink Ray
// In damage loop:
// We need to insert Evade logic right before damage is subtracted.
// And Alpha Monster / Parasitic Tentacles logic.
// Let's replace the whole attack phase? It's huge. 
// I'll do specific replace.
// "let actualDmg = results.attack;" -> "let actualDmg = results.attack;"
// Wait, the damage dealt to `other` is inside the loop.
content = content.replace(
  `          let actualDmg = results.attack;
          
          if (hasFireBreathing && neighbors.includes(other.id)) {`,
  `          let actualDmg = results.attack;
          
          if (hasFireBreathing && neighbors.includes(other.id)) {`
);

fs.writeFileSync('backend/src/index.ts', content, 'utf8');
