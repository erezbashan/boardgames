const fs = require('fs');
let content = fs.readFileSync('backend/src/gameLogic.ts', 'utf8');

content = content.replace(
  `export function createInitialGameState(id: string): GameState {`,
  `export function createInitialGameState(id: string, settings?: any): GameState {
  const gameSettings = settings || { maxHealth: 10, startingHealth: 10, winningVP: 20 };`
);

content = content.replace(
  `    highlightedStats: []
  };
}`,
  `    highlightedStats: [],
    settings: gameSettings
  };
}`
);

fs.writeFileSync('backend/src/gameLogic.ts', content, 'utf8');
