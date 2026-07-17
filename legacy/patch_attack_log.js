const fs = require('fs');
let content = fs.readFileSync('backend/src/index.ts', 'utf8');

// We need to inject targetNames array
content = content.replace(
  `    let playerInTokyo: any = null;
    const modifierLogs: string[] = [];`,
  `    let playerInTokyo: any = null;
    const modifierLogs: string[] = [];
    const targetNames: string[] = [];`
);

content = content.replace(
  `      if (isTarget) {
        const armor = other.cards.reduce`,
  `      if (isTarget) {
        targetNames.push(other.name);
        const armor = other.cards.reduce`
);

content = content.replace(
  `    if (hitSomeone || modifierLogs.length > 0) {
      if (hasNovaBreath) {
        game.logs.push(\`🌊 \${p.name} dealt 💥 damage to ALL other players! (Nova Breath)\`);
      } else {
        game.logs.push(\`\${p.name} dealt 💥 damage!\`);
      }
      game.logs.push(...modifierLogs);
    }`,
  `    if (hitSomeone || modifierLogs.length > 0 || targetNames.length > 0) {
      const targetsStr = targetNames.length > 0 ? targetNames.join(', ') : 'no one';
      if (hasNovaBreath) {
        game.logs.push(\`🌊 \${p.name} dealt \${results.attack} 💥 damage to ALL other players (\${targetsStr})! (Nova Breath)\`);
      } else {
        game.logs.push(\`\${p.name} dealt \${results.attack} 💥 damage to \${targetsStr}!\`);
      }
      game.logs.push(...modifierLogs);
    }`
);

fs.writeFileSync('backend/src/index.ts', content, 'utf8');
