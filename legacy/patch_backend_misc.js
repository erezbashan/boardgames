const fs = require('fs');
let content = fs.readFileSync('backend/src/index.ts', 'utf8');

// Fix human BUY_CARD log
content = content.replace(
  `game.logs.push(\`BUY_CARD:\${player.name}:\${JSON.stringify(card)}\`);`,
  `game.logs.push(\`\${player.name} bought \${card.name} for \${card.cost} ⚡!\`);`
);

// Fix history bug on reconnect
content = content.replace(
  `        if (game.history) {
          game.history.forEach(h => {
            if (h.playerId === previousPlayerId) h.playerId = socket.id;
          });
        }`,
  `        if (game.history) {
          game.history.forEach(h => {
            if (h.players && h.players[previousPlayerId]) {
              h.players[socket.id] = h.players[previousPlayerId];
              h.players[socket.id].id = socket.id;
              delete h.players[previousPlayerId];
            }
          });
        }`
);

fs.writeFileSync('backend/src/index.ts', content, 'utf8');
