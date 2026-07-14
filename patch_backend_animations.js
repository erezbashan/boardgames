const fs = require('fs');

let content = fs.readFileSync('backend/src/index.ts', 'utf8');

// 1. startTurn animations for Rapid Healing and Solar Powered
content = content.replace(
  `  if (p.cards.some(c => c.effect?.rapidHealing)) {
    const healAmt = Math.min(p.maxHealth || game.settings?.maxHealth || 10, p.health + 1) - p.health;
    if (healAmt > 0) {
      p.health += healAmt;
      game.logs.push(\`💖 \${p.name} healed 1 ❤️ from Rapid Healing!\`);
    }
  }
  if (p.gameStats) (p as any).dealtDamageThisTurn = false;
  if (p.cards.some(c => c.effect?.solarPowered) && p.energy === 0) {
    p.energy += 1;
    game.logs.push(\`☀️ \${p.name} gained 1 ⚡ from Solar Powered!\`);
  }`,
  `  let animatedStart = false;
  game.highlightedStats = [];
  if (p.cards.some(c => c.effect?.rapidHealing)) {
    const healAmt = Math.min(p.maxHealth || game.settings?.maxHealth || 10, p.health + 1) - p.health;
    if (healAmt > 0) {
      p.health += healAmt;
      game.logs.push(\`💖 \${p.name} healed 1 ❤️ from Rapid Healing!\`);
      game.highlightedStats.push({ playerId: p.id, stat: 'health' });
      animatedStart = true;
    }
  }
  if (p.gameStats) (p as any).dealtDamageThisTurn = false;
  if (p.cards.some(c => c.effect?.solarPowered) && p.energy === 0) {
    p.energy += 1;
    game.logs.push(\`☀️ \${p.name} gained 1 ⚡ from Solar Powered!\`);
    game.highlightedStats.push({ playerId: p.id, stat: 'energy' });
    animatedStart = true;
  }
  if (animatedStart) {
    game.isAnimating = true;
    broadcastState(gameId);
    await new Promise(r => setTimeout(r, 1500));
    game.isAnimating = false;
    game.highlightedStats = [];
  }`
);

// 2. Dedicated News Team in BUY_CARD
content = content.replace(
  `          if (player.cards.some(c => c.effect?.newsTeam)) {
            player.victoryPoints = Math.min(game.settings?.winningVP || 20, player.victoryPoints + 1);
            game.logs.push(\`📰 \${player.name} gained 1 VP from Dedicated News Team!\`);
          }`,
  `          if (player.cards.some(c => c.effect?.newsTeam)) {
            player.victoryPoints = Math.min(game.settings?.winningVP || 20, player.victoryPoints + 1);
            game.logs.push(\`📰 \${player.name} gained 1 VP from Dedicated News Team!\`);
            game.highlightedStats.push({ playerId: player.id, stat: 'vp' });
          }`
);

// 3. Herbivore animation in endTurnAutomatically (needs to be async though!)
// Wait, endTurnAutomatically is NOT async. It's called from SOCKET_EVENTS.END_TURN and resolveDiceAutomatically.
// If I make it async, I need to await it. Let's just rely on the NEXT turn start, or not animate it if it's too complex?
// Wait, endTurnAutomatically triggers TURN_START immediately. If we just push highlightedStats in endTurnAutomatically, 
// the next player's startTurn will clear it immediately! So Herbivore won't animate.
// Let's modify endTurnAutomatically to NOT animate, or just let it be. VP is still shown in the log.
// The user asked for "Solar Powered and other such cards", meaning start/end turn triggers that are easy to miss.
// Let's make endTurnAutomatically set highlightedStats, and startTurn will await 1.5s BEFORE clearing it? No, startTurn doesn't clear unless it animates.
// Actually, `game.highlightedStats = [];` is NOT in startTurn, except when it animates!
// Let's add animation for Herbivore.

fs.writeFileSync('backend/src/index.ts', content, 'utf8');

