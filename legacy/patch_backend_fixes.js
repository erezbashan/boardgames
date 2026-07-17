const fs = require('fs');
let content = fs.readFileSync('backend/src/index.ts', 'utf8');

// Fix turnDied assignment
content = content.replace(
  `if (p.gameStats) p.gameStats.turnDied = game.turnCount;`,
  `if (p.gameStats) p.gameStats.turnDied = game.history && game.history.length > 0 ? game.history[game.history.length - 1].turnNumber : 0;`
);
content = content.replace(
  `other.gameStats.turnDied = game.turnCount;`,
  `other.gameStats.turnDied = game.history && game.history.length > 0 ? game.history[game.history.length - 1].turnNumber : 0;`
);

// Fix h.players error
content = content.replace(
  `          game.history.forEach(h => {
            if (h.players && h.players[previousPlayerId]) {
              h.players[socket.id] = h.players[previousPlayerId];
              h.players[socket.id].id = socket.id;
              delete h.players[previousPlayerId];
            }
          });`,
  `          game.history.forEach(h => {
            if (h.playerId === previousPlayerId) {
              h.playerId = socket.id;
            }
          });`
);

// Fix missing playersKilled
content = content.replace(
  `damageDealt: 0,
        cardsBought: 0,`,
  `damageDealt: 0,
        playersKilled: 0,
        cardsBought: 0,`
);

fs.writeFileSync('backend/src/index.ts', content, 'utf8');
