const fs = require('fs');
let content = fs.readFileSync('backend/src/index.ts', 'utf8');

// 1. startedTurnInTokyoCount
content = content.replace(
  `  if (p.inTokyo) {
    p.victoryPoints = Math.min(20, p.victoryPoints + 2);
    game.logs.push(\`👑 \${p.name} started their turn in Tokyo City! (+2 VP)\`);`,
  `  if (p.inTokyo) {
    p.victoryPoints = Math.min(20, p.victoryPoints + 2);
    if (p.gameStats) p.gameStats.startedTurnInTokyoCount += 1;
    game.logs.push(\`👑 \${p.name} started their turn in Tokyo City! (+2 VP)\`);`
);

// 2. enteredTokyoCount (resolveDice empty tokyo)
content = content.replace(
  `      if (isTokyoEmpty) {
        p.inTokyo = true;
        p.victoryPoints = Math.min(20, p.victoryPoints + 1);
        game.logs.push(\`👑 \${p.name} entered Tokyo City! (+1 VP)\`);`,
  `      if (isTokyoEmpty) {
        p.inTokyo = true;
        p.victoryPoints = Math.min(20, p.victoryPoints + 1);
        if (p.gameStats) p.gameStats.enteredTokyoCount += 1;
        game.logs.push(\`👑 \${p.name} entered Tokyo City! (+1 VP)\`);`
);

// 3. enteredTokyoCount (yielding)
content = content.replace(
  `        attacker.inTokyo = true;
        attacker.victoryPoints = Math.min(20, attacker.victoryPoints + 1);
        game.logs.push(\`🏙️ \${attacker.name} takes control of Tokyo!\`);`,
  `        attacker.inTokyo = true;
        attacker.victoryPoints = Math.min(20, attacker.victoryPoints + 1);
        if (attacker.gameStats) attacker.gameStats.enteredTokyoCount += 1;
        game.logs.push(\`🏙️ \${attacker.name} takes control of Tokyo!\`);`
);

fs.writeFileSync('backend/src/index.ts', content, 'utf8');
