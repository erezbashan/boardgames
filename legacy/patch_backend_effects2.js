const fs = require('fs');

// Patch Jetpack description in gameLogic.ts
let logic = fs.readFileSync('backend/src/gameLogic.ts', 'utf8');
logic = logic.replace(
  `You suffer no damage when yielding Tokyo.`,
  `Gain 2 Energy when you yield Tokyo.`
);
fs.writeFileSync('backend/src/gameLogic.ts', logic, 'utf8');

// Patch index.ts damage loop
let content = fs.readFileSync('backend/src/index.ts', 'utf8');

// Jetpack logic
content = content.replace(
  `function yieldTokyo(gameId: string, playerIds: string[], stay: boolean) {`,
  `function yieldTokyo(gameId: string, playerIds: string[], stay: boolean) {`
);
content = content.replace(
  `        const yielder = game.players[pid];
        if (yielder) {
          yielder.inTokyo = false;`,
  `        const yielder = game.players[pid];
        if (yielder) {
          yielder.inTokyo = false;
          if (yielder.cards.some(c => c.effect?.jetpack)) {
            yielder.energy += 2;
            game.logs.push(\`🚀 \${yielder.name} gained 2 ⚡ from Jetpack for yielding Tokyo!\`);
          }`
);

// Spiked Tail
// When bought, deal 2 damage to all other players.
// It's a discard. The BUY_CARD event handles it.
// Wait, BUY_CARD doesn't execute effect yet! It only does `vp`, `energy`, `heal`.
// Let's check BUY_CARD.
content = content.replace(
  `        if (card.effect.energy) {`,
  `        if (card.effect.spikeDamage) {
          const dmg = card.effect.spikeDamage;
          Object.values(game.players).forEach(other => {
            if (other.id !== p.id && other.health > 0) {
              const armor = other.cards.reduce((sum, c) => sum + (c.effect?.armor || 0), 0);
              const evadeIdx = other.cards.findIndex(c => c.effect?.evade);
              if (evadeIdx !== -1) {
                other.cards.splice(evadeIdx, 1);
                game.logs.push(\`💨 \${other.name} Evaded the Spiked Tail!\`);
                return;
              }
              const actualDmg = Math.max(0, dmg - armor);
              if (actualDmg > 0) {
                other.health -= actualDmg;
                game.highlightedStats.push({ playerId: other.id, stat: 'health' });
                if (other.health <= 0) {
                  game.logs.push(\`💀 \${other.name} was killed by Spiked Tail!\`);
                  other.gameStats.turnDied = game.turnCount;
                }
              }
            }
          });
        }
        if (card.effect.energy) {`
);

// Frenzy
content = content.replace(
  `function endTurnAutomatically(gameId: string, socketId: string) {`,
  `function endTurnAutomatically(gameId: string, socketId: string) {`
);
content = content.replace(
  `  const nextId = game.playerOrder[nextIdx];
  startTurn(gameId, nextId);`,
  `  const frenzyIdx = game.players[socketId].cards.findIndex(c => c.effect?.frenzy);
  if (frenzyIdx !== -1) {
    game.players[socketId].cards.splice(frenzyIdx, 1);
    game.logs.push(\`🌪️ \${game.players[socketId].name} takes an EXTRA TURN from Frenzy!\`);
    startTurn(gameId, socketId);
    return;
  }
  const nextId = game.playerOrder[nextIdx];
  startTurn(gameId, nextId);`
);

// Shrink Ray dice reduction
content = content.replace(
  `    const extraDice = activeP?.cards?.reduce((sum: number, c: any) => sum + (c.effect?.extraDie || 0), 0) || 0;
    const numDice = 6 + extraDice;`,
  `    const extraDice = activeP?.cards?.reduce((sum: number, c: any) => sum + (c.effect?.extraDie || 0), 0) || 0;
    const shrink = activeP?.shrinkTokens || 0;
    const numDice = Math.max(1, 6 + extraDice - shrink);`
);

// Damage Loop patches (Evade, Shrink Ray, Alpha Monster, Parasitic Tentacles)
content = content.replace(
  `        let actualDmg = Math.max(0, dmg - armor);
        if (actualDmg > 0) {`,
  `        const evadeIdx = other.cards.findIndex(c => c.effect?.evade);
        if (evadeIdx !== -1 && dmg > 0) {
          other.cards.splice(evadeIdx, 1);
          dmg = 0;
          modifierLogs.push(\`💨 \${other.name} Evaded the attack!\`);
        }
        let actualDmg = Math.max(0, dmg - armor);
        if (actualDmg > 0) {`
);

content = content.replace(
  `          hitSomeone = true;
          
          if (extraFireDamage > 0) {`,
  `          hitSomeone = true;
          
          if (p.cards.some(c => c.effect?.shrinkRay)) {
            other.shrinkTokens = Math.min(1, (other.shrinkTokens || 0) + 1);
            modifierLogs.push(\`📉 \${other.name} was shrunk!\`);
          }
          if (p.cards.some(c => c.effect?.parasitic)) {
            const actualHeal = Math.min(p.maxHealth || game.settings?.maxHealth || 10, p.health + 1) - p.health;
            if (actualHeal > 0) {
              p.health += actualHeal;
              modifierLogs.push(\`🦑 \${p.name} healed 1 ❤️ from Parasitic Tentacles!\`);
              game.highlightedStats.push({ playerId: p.id, stat: 'health' });
            }
          }
          if (p.cards.some(c => c.effect?.alphaMonster)) {
            if (p.victoryPoints < (game.settings?.winningVP || 20)) {
              p.victoryPoints += 1;
              modifierLogs.push(\`🐺 \${p.name} gained 1 ⭐ from Alpha Monster!\`);
              game.highlightedStats.push({ playerId: p.id, stat: 'vp' });
            }
          }
          
          if (extraFireDamage > 0) {`
);

// Solar Powered
content = content.replace(
  `function startTurn(gameId: string, playerId: string) {`,
  `function startTurn(gameId: string, playerId: string) {`
);
content = content.replace(
  `  if (p.poisonTokens > 0) {`,
  `  if (p.cards.some(c => c.effect?.solarPowered) && p.energy === 0) {
    p.energy += 1;
    game.logs.push(\`☀️ \${p.name} gained 1 ⚡ from Solar Powered!\`);
  }
  
  if (p.poisonTokens > 0) {`
);


fs.writeFileSync('backend/src/index.ts', content, 'utf8');
