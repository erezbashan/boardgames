const fs = require('fs');
let content = fs.readFileSync('backend/src/index.ts', 'utf8');

// Inside START_GAME
content = content.replace(
  `        p.color = PLAYER_COLORS[index % PLAYER_COLORS.length];
        p.health = game.settings?.startingHealth || 10;
        p.gameStats = {`,
  `        p.color = PLAYER_COLORS[index % PLAYER_COLORS.length];
        p.health = game.settings?.startingHealth || 10;
        p.maxHealth = game.settings?.maxHealth || 10;
        p.gameStats = {`
);

// Inside CREATE_GAME
content = content.replace(
  `health: games[gameId] && games[gameId].settings ? games[gameId].settings.startingHealth : 10,
      victoryPoints: 0,`,
  `health: games[gameId] && games[gameId].settings ? games[gameId].settings.startingHealth : 10,
      maxHealth: games[gameId] && games[gameId].settings ? games[gameId].settings.maxHealth : 10,
      victoryPoints: 0,`
);

// Inside JOIN_GAME
content = content.replace(
  `      health: games[gameId] && games[gameId].settings ? games[gameId].settings.startingHealth : 10,
      victoryPoints: 0,`,
  `      health: games[gameId] && games[gameId].settings ? games[gameId].settings.startingHealth : 10,
      maxHealth: games[gameId] && games[gameId].settings ? games[gameId].settings.maxHealth : 10,
      victoryPoints: 0,`
);

// Inside ADD_BOT
content = content.replace(
  `        health: games[gameId] && games[gameId].settings ? games[gameId].settings.startingHealth : 10,
        victoryPoints: 0,`,
  `        health: games[gameId] && games[gameId].settings ? games[gameId].settings.startingHealth : 10,
        maxHealth: games[gameId] && games[gameId].settings ? games[gameId].settings.maxHealth : 10,
        victoryPoints: 0,`
);

// Inside RETURN_TO_LOBBY
content = content.replace(
  `        p.health = game.settings?.startingHealth || 10;
        p.victoryPoints = 0,`,
  `        p.health = game.settings?.startingHealth || 10;
        p.maxHealth = game.settings?.maxHealth || 10;
        p.victoryPoints = 0,`
);

fs.writeFileSync('backend/src/index.ts', content, 'utf8');
