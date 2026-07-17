const fs = require('fs');

// Fix index.ts
let index = fs.readFileSync('backend/src/index.ts', 'utf8');
index = index.replace(
  /game && game\.settings \? game\.settings\.startingHealth : 10/g,
  `games[gameId] && games[gameId].settings ? games[gameId].settings.startingHealth : 10`
);
fs.writeFileSync('backend/src/index.ts', index, 'utf8');

// Fix gameLogic.ts
let logic = fs.readFileSync('backend/src/gameLogic.ts', 'utf8');
logic = logic.replace(
  `    logs: ['Game created'],
  };
}`,
  `    logs: ['Game created'],
    settings: gameSettings
  };
}`
);
// Also fallback
if (!logic.includes('settings: gameSettings')) {
  logic = logic.replace(
    `    turnCount: 0
  };
}`,
    `    turnCount: 0,
    settings: gameSettings
  };
}`
  );
}
fs.writeFileSync('backend/src/gameLogic.ts', logic, 'utf8');
