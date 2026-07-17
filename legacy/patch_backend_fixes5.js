const fs = require('fs');

let content = fs.readFileSync('backend/src/index.ts', 'utf8');

// 1. Jetpack (yieldTokyo logic in resolveDiceAutomatically)
content = content.replace(
  /playerInTokyo\.inTokyo = false;\n\s*game\.logs\.push\(\`\$\{playerInTokyo\.name\} yielded Tokyo!\`\);/g,
  `playerInTokyo.inTokyo = false;
          if (playerInTokyo.cards.some(c => c.effect?.jetpack)) {
            playerInTokyo.energy += 2;
            game.logs.push(\`🚀 \${playerInTokyo.name} gained 2 ⚡ from Jetpack for yielding Tokyo!\`);
          }
          game.logs.push(\`\${playerInTokyo.name} yielded Tokyo!\`);`
);

// 2. Alpha Monster (move out of loop)
content = content.replace(
  `          if (p.cards.some(c => c.effect?.alphaMonster)) {
            p.victoryPoints = Math.min(game.settings?.winningVP || 20, p.victoryPoints + 1);
            modifierLogs.push(\`🐺 \${p.name} gained 1 ⭐ from Alpha Monster!\`);
            game.highlightedStats.push({ playerId: p.id, stat: 'vp' });
          }`,
  ``
);
// Insert it after the loop if hitSomeone is true
content = content.replace(
  `      if (hasNovaBreath) {`,
  `      if (p.cards.some(c => c.effect?.alphaMonster)) {
        p.victoryPoints = Math.min(game.settings?.winningVP || 20, p.victoryPoints + 1);
        modifierLogs.push(\`🐺 \${p.name} gained 1 ⭐ from Alpha Monster!\`);
        game.highlightedStats.push({ playerId: p.id, stat: 'vp' });
      }
      if (hasNovaBreath) {`
);

// 3. Spiked Tail (in BUY_CARD)
content = content.replace(
  `          if (card.effect?.highAltitude) {`,
  `          if (card.effect?.spikedTail) {
            const dmg = 2;
            Object.values(game.players).forEach(other => {
              if (other.id !== player.id && other.health > 0) {
                const armor = other.cards.reduce((sum, c) => sum + (c.effect?.armor || 0), 0);
                const evadeIdx = other.cards.findIndex(c => c.effect?.evade);
                if (evadeIdx !== -1) {
                  other.cards.splice(evadeIdx, 1);
                  game.logs.push(\`💨 \${other.name} Evaded Spiked Tail!\`);
                  return;
                }
                const actualDmg = Math.max(0, dmg - armor);
                if (actualDmg > 0) {
                  other.health -= actualDmg;
                  game.highlightedStats.push({ playerId: other.id, stat: 'health' });
                  if (other.health <= 0) {
                    game.logs.push(\`💀 \${other.name} was killed by Spiked Tail!\`);
                    if (other.gameStats) other.gameStats.turnDied = game.history && game.history.length > 0 ? game.history[game.history.length - 1].turnNumber : 0;
                  }
                }
              }
            });
          }
          if (card.effect?.highAltitude) {`
);

fs.writeFileSync('backend/src/index.ts', content, 'utf8');

// Patch botLogic.ts for Starting Dice and Shrink
let botLogic = fs.readFileSync('backend/src/botLogic.ts', 'utf8');
botLogic = botLogic.replace(
  `  const extraDice = bot.cards.reduce((sum, c) => sum + (c.effect?.extraDie || 0), 0);
  game.currentDice = rollDice(6 + extraDice);`,
  `  const extraDice = bot.cards.reduce((sum, c) => sum + (c.effect?.extraDie || 0), 0);
  const shrink = bot.shrinkTokens || 0;
  const base = game.settings?.startingDice || 6;
  game.currentDice = rollDice(Math.max(1, base + extraDice - shrink));`
);
fs.writeFileSync('backend/src/botLogic.ts', botLogic, 'utf8');

