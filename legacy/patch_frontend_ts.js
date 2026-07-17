const fs = require('fs');

let gameover = fs.readFileSync('frontend/src/GameOverScreen.tsx', 'utf8');

// Fix unused 'onLobbyReturn'
gameover = gameover.replace(
  `({ gameState, onClose, onLobbyReturn }: { gameState: GameState, onClose: () => void, onLobbyReturn: () => void })`,
  `({ gameState, onClose }: { gameState: GameState, onClose: () => void })`
);
gameover = gameover.replace(
  `{ gameState, onClose, onLobbyReturn }: { gameState: GameState, onClose: () => void, onLobbyReturn: () => void }`,
  `{ gameState, onClose }: { gameState: GameState, onClose: () => void }`
);

// Fix unused 'i' and 'gamePlayers' to 'gameState.players'
gameover = gameover.replace(
  `          {chartData.map((d, i) => {`,
  `          {chartData.map((d) => {`
);
gameover = gameover.replace(
  `            const player = tokyoPlayerHistory ? gamePlayers[tokyoPlayerHistory.playerId] : null;`,
  `            const player = tokyoPlayerHistory ? gameState.players[tokyoPlayerHistory.playerId] : null;`
);

fs.writeFileSync('frontend/src/GameOverScreen.tsx', gameover, 'utf8');

let app = fs.readFileSync('frontend/src/App.tsx', 'utf8');
app = app.replace(
  `<GameOverScreen gameState={gameState} onClose={() => setShowStats(false)} onLobbyReturn={() => returnToLobby(gameState.id)} />`,
  `<GameOverScreen gameState={gameState} onClose={() => setShowStats(false)} />`
);
fs.writeFileSync('frontend/src/App.tsx', app, 'utf8');

