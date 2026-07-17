const fs = require('fs');

let gameover = fs.readFileSync('frontend/src/GameOverScreen.tsx', 'utf8');

gameover = gameover.replace(
  `  onLobbyReturn: () => void;`,
  ``
);

gameover = gameover.replace(
  `export function GameOverScreen({ gameState, onLobbyReturn, onClose }: Props) {`,
  `export function GameOverScreen({ gameState, onClose }: Props) {`
);

fs.writeFileSync('frontend/src/GameOverScreen.tsx', gameover, 'utf8');

