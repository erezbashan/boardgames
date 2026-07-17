const fs = require('fs');

let content = fs.readFileSync('backend/src/index.ts', 'utf8');

// 1. startTurn patches (Giant Brain, Rapid Healing, Herbivore init)
content = content.replace(
  `  game.rollsLeft = 3;`,
  `  game.rollsLeft = p.cards.some(c => c.effect?.giantBrain) ? 4 : 3;`
);

content = content.replace(
  `  if (p.cards.some(c => c.effect?.solarPowered) && p.energy === 0) {`,
  `  if (p.cards.some(c => c.effect?.rapidHealing)) {
    const healAmt = Math.min(p.maxHealth || game.settings?.maxHealth || 10, p.health + 1) - p.health;
    if (healAmt > 0) {
      p.health += healAmt;
      game.logs.push(\`💖 \${p.name} healed 1 ❤️ from Rapid Healing!\`);
    }
  }
  if (p.gameStats) (p as any).dealtDamageThisTurn = false;
  if (p.cards.some(c => c.effect?.solarPowered) && p.energy === 0) {`
);

// 2. Omnivore
content = content.replace(
  `    p.victoryPoints = Math.min(20, p.victoryPoints + results.points);`,
  `    let pts = results.points;
    if (p.cards.some(c => c.effect?.omnivore)) {
      pts += 2;
      game.logs.push(\`🍖 \${p.name} gained 2 extra VP from Omnivore!\`);
    }
    p.victoryPoints = Math.min(game.settings?.winningVP || 20, p.victoryPoints + pts);`
);
content = content.replace(
  `    game.logs.push(\`\${p.name} gained \${results.points} VP.\`);`,
  `    game.logs.push(\`\${p.name} gained \${pts} VP.\`);`
);

// 3. Damage Loop (Poison Quills, Spiked Armor, Herbivore tracking)
content = content.replace(
  `        if (actualDmg > 0) {`,
  `        if (actualDmg > 0) {
          (p as any).dealtDamageThisTurn = true;
          if (p.cards.some(c => c.effect?.poisonQuills)) {
            other.energy = Math.max(0, other.energy - 1);
            modifierLogs.push(\`🪶 \${other.name} lost 1 ⚡ from Poison Quills!\`);
          }
          if (other.cards.some(c => c.effect?.spikedArmor)) {
            p.health = Math.max(0, p.health - 1);
            modifierLogs.push(\`🛡️ \${p.name} took 1 damage from \${other.name}'s Spiked Armor!\`);
            game.highlightedStats.push({ playerId: p.id, stat: 'health' });
            if (p.health <= 0) {
              game.logs.push(\`💀 \${p.name} was killed by Spiked Armor!\`);
              if (p.gameStats) p.gameStats.turnDied = game.turnCount;
            }
          }`
);

// 4. Herbivore end of turn
content = content.replace(
  `function endTurnAutomatically(gameId: string, socketId: string) {`,
  `function endTurnAutomatically(gameId: string, socketId: string) {`
);
content = content.replace(
  `  const nextIdx = (aliveOrder.indexOf(socketId) + 1) % aliveOrder.length;`,
  `  if (game.players[socketId].cards.some(c => c.effect?.herbivore) && !(game.players[socketId] as any).dealtDamageThisTurn) {
    game.players[socketId].victoryPoints = Math.min(game.settings?.winningVP || 20, game.players[socketId].victoryPoints + 1);
    game.logs.push(\`🌱 \${game.players[socketId].name} gained 1 VP from Herbivore for dealing no damage!\`);
  }
  const nextIdx = (aliveOrder.indexOf(socketId) + 1) % aliveOrder.length;`
);


// 5. BUY_CARD logic (Alien Metabolism, Dedicated News Team, Evacuation Orders, High Altitude Bombing)
content = content.replace(
  `        if (player.energy >= card.cost) {
          player.energy -= card.cost;`,
  `        const cost = player.cards.some(c => c.effect?.alienMetabolism) ? Math.max(0, card.cost - 1) : card.cost;
        if (player.energy >= cost) {
          player.energy -= cost;`
);
content = content.replace(
  `            player.gameStats.energySpent += card.cost;`,
  `            player.gameStats.energySpent += cost;`
);

content = content.replace(
  `          game.highlightedStats = [];`,
  `          game.highlightedStats = [];
          if (player.cards.some(c => c.effect?.newsTeam)) {
            player.victoryPoints = Math.min(game.settings?.winningVP || 20, player.victoryPoints + 1);
            game.logs.push(\`📰 \${player.name} gained 1 VP from Dedicated News Team!\`);
          }
          if (card.effect?.evacuation) {
            Object.values(game.players).forEach(other => {
              if (other.id !== player.id) {
                other.victoryPoints = Math.max(0, other.victoryPoints - 5);
                game.highlightedStats.push({ playerId: other.id, stat: 'vp' });
              }
            });
            game.logs.push(\`🚨 All other players lost 5 VP from Evacuation Orders!\`);
          }
          if (card.effect?.highAltitude) {
            const dmg = 3;
            Object.values(game.players).forEach(other => {
              if (other.health > 0) {
                const armor = other.cards.reduce((sum, c) => sum + (c.effect?.armor || 0), 0);
                const evadeIdx = other.cards.findIndex(c => c.effect?.evade);
                if (evadeIdx !== -1) {
                  other.cards.splice(evadeIdx, 1);
                  game.logs.push(\`💨 \${other.name} Evaded High Altitude Bombing!\`);
                  return;
                }
                const actualDmg = Math.max(0, dmg - armor);
                if (actualDmg > 0) {
                  other.health -= actualDmg;
                  game.highlightedStats.push({ playerId: other.id, stat: 'health' });
                  if (other.health <= 0) {
                    game.logs.push(\`💀 \${other.name} was killed by High Altitude Bombing!\`);
                    if (other.gameStats) other.gameStats.turnDied = game.turnCount;
                  }
                }
              }
            });
          }`
);

fs.writeFileSync('backend/src/index.ts', content, 'utf8');

