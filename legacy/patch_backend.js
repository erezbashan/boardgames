const fs = require('fs');
let content = fs.readFileSync('backend/src/index.ts', 'utf8');

// 1. Initialize stats in START_GAME and RETURN_TO_LOBBY
content = content.replace(
  `        p.gameStats = {
          damageDealt: 0,
          cardsBought: 0,
          energySpent: 0
        };`,
  `        p.gameStats = {
          damageDealt: 0,
          cardsBought: 0,
          energySpent: 0,
          enteredTokyoCount: 0,
          startedTurnInTokyoCount: 0,
          energyGained: 0,
          healingGained: 0,
        };`
);
content = content.replace(
  `        p.gameStats = {
          damageDealt: 0,
          cardsBought: 0,
          energySpent: 0
        };`,
  `        p.gameStats = {
          damageDealt: 0,
          cardsBought: 0,
          energySpent: 0,
          enteredTokyoCount: 0,
          startedTurnInTokyoCount: 0,
          energyGained: 0,
          healingGained: 0,
        };`
);

// 2. Track bot card buying in executeBotTurn
// Let's find executeBotTurn
// botPlayer.energy -= affordableCards[0].cost;
// botPlayer.cards.push(affordableCards[0]);
// We need to insert stats logic
content = content.replace(
  `botPlayer.energy -= cardToBuy.cost;
        botPlayer.cards.push(cardToBuy);`,
  `botPlayer.energy -= cardToBuy.cost;
        botPlayer.cards.push(cardToBuy);
        if (!botPlayer.gameStats) botPlayer.gameStats = { damageDealt: 0, cardsBought: 0, energySpent: 0, enteredTokyoCount: 0, startedTurnInTokyoCount: 0, energyGained: 0, healingGained: 0 };
        botPlayer.gameStats.cardsBought += 1;
        botPlayer.gameStats.energySpent += cardToBuy.cost;`
);

// 3. Track Entering Tokyo in resolveDice
// if (!tokyoOccupied) { p.inTokyo = true; p.victoryPoints += 1; ... }
content = content.replace(
  `        game.logs.push(\`🏙️ \${p.name} entered Tokyo and gained 1 VP!\`);
      }`,
  `        game.logs.push(\`🏙️ \${p.name} entered Tokyo and gained 1 VP!\`);
        if (p.gameStats) p.gameStats.enteredTokyoCount += 1;
      }`
);

// Track entering Tokyo in yield logic (YIELD_TOKYO)
content = content.replace(
  `        game.logs.push(\`🏙️ \${attacker.name} takes control of Tokyo!\`);
      }`,
  `        game.logs.push(\`🏙️ \${attacker.name} takes control of Tokyo!\`);
        if (attacker.gameStats) attacker.gameStats.enteredTokyoCount += 1;
      }`
);


// 4. Track Started Turn in Tokyo and Healing
// Actually let's just insert these directly in resolveDice for healing and energy
content = content.replace(
  `  const energyGained = currentDice.filter(d => d.face === 'Lightning').length;
  if (energyGained > 0) {
    p.energy += energyGained;
    game.logs.push(\`⚡ \${p.name} gained \${energyGained} energy.\`);
  }`,
  `  const energyGained = currentDice.filter(d => d.face === 'Lightning').length;
  if (energyGained > 0) {
    p.energy += energyGained;
    if (p.gameStats) p.gameStats.energyGained += energyGained;
    game.logs.push(\`⚡ \${p.name} gained \${energyGained} energy.\`);
  }`
);

content = content.replace(
  `    p.health = Math.min(maxH, p.health + healAmount);
    game.logs.push(\`❤️ \${p.name} healed \${healAmount} damage.\`);
  }`,
  `    p.health = Math.min(maxH, p.health + healAmount);
    if (p.gameStats) p.gameStats.healingGained += healAmount;
    game.logs.push(\`❤️ \${p.name} healed \${healAmount} damage.\`);
  }`
);

// Track startedTurnInTokyoCount
// In startNextTurn
content = content.replace(
  `  if (nextP.inTokyo) {
    nextP.victoryPoints += 2;`,
  `  if (nextP.inTokyo) {
    nextP.victoryPoints += 2;
    if (nextP.gameStats) nextP.gameStats.startedTurnInTokyoCount += 1;`
);

// 5. Track turnDied
// In damage loop (already added `if (p.health <= 0) { game.logs.push... }`)
content = content.replace(
  `      if (p.health <= 0) {
        game.logs.push(\`💀 \${p.name} was killed!\`);
      }`,
  `      if (p.health <= 0) {
        game.logs.push(\`💀 \${p.name} was killed!\`);
        if (p.gameStats) p.gameStats.turnDied = game.turnCount;
      }`
);

// In poison damage
content = content.replace(
  `    if (p.health <= 0) {
      game.logs.push(\`💀 \${p.name} was killed!\`);
    }`,
  `    if (p.health <= 0) {
      game.logs.push(\`💀 \${p.name} was killed!\`);
      if (p.gameStats) p.gameStats.turnDied = game.turnCount;
    }`
);

fs.writeFileSync('backend/src/index.ts', content, 'utf8');
