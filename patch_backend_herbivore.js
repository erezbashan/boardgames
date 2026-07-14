const fs = require('fs');

let content = fs.readFileSync('backend/src/index.ts', 'utf8');

// 1. Make endTurnAutomatically async
content = content.replace(
  `function endTurnAutomatically(gameId: string, socketId: string) {`,
  `async function endTurnAutomatically(gameId: string, socketId: string) {`
);

// 2. Add animation logic for Herbivore
content = content.replace(
  `  if (game.players[socketId].cards.some(c => c.effect?.herbivore) && !(game.players[socketId] as any).dealtDamageThisTurn) {
    game.players[socketId].victoryPoints = Math.min(game.settings?.winningVP || 20, game.players[socketId].victoryPoints + 1);
    game.logs.push(\`🌱 \${game.players[socketId].name} gained 1 VP from Herbivore for dealing no damage!\`);
  }`,
  `  if (game.players[socketId].cards.some(c => c.effect?.herbivore) && !(game.players[socketId] as any).dealtDamageThisTurn) {
    game.players[socketId].victoryPoints = Math.min(game.settings?.winningVP || 20, game.players[socketId].victoryPoints + 1);
    game.logs.push(\`🌱 \${game.players[socketId].name} gained 1 VP from Herbivore for dealing no damage!\`);
    game.highlightedStats = [{ playerId: socketId, stat: 'vp' }];
    game.isAnimating = true;
    broadcastState(gameId);
    await new Promise(r => setTimeout(r, 1500));
    game.isAnimating = false;
    game.highlightedStats = [];
  }`
);

fs.writeFileSync('backend/src/index.ts', content, 'utf8');

