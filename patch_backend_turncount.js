const fs = require('fs');

let content = fs.readFileSync('backend/src/index.ts', 'utf8');

content = content.replace(
  /p\.gameStats\.turnDied = game\.turnCount;/g,
  `p.gameStats.turnDied = game.history && game.history.length > 0 ? game.history[game.history.length - 1].turnNumber : 0;`
);

content = content.replace(
  /other\.gameStats\.turnDied = game\.turnCount;/g,
  `other.gameStats.turnDied = game.history && game.history.length > 0 ? game.history[game.history.length - 1].turnNumber : 0;`
);

fs.writeFileSync('backend/src/index.ts', content, 'utf8');

