import fs from 'fs';
import path from 'path';

const file = path.join(__dirname, 'frontend/src/App.tsx');
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import { GameOverScreen }')) {
  content = content.replace("import './App.css';", "import './App.css';\nimport { GameOverScreen } from './GameOverScreen';");
}

if (!content.includes('if (gameState.status === \'GameOver\') {')) {
  const replacement = `
  if (gameState.status === 'GameOver') {
    return <GameOverScreen gameState={gameState} onLobbyReturn={() => socket?.emit('RETURN_TO_LOBBY', gameState.id)} />;
  }

  // GAME BOARD VIEW
`;
  content = content.replace('// GAME BOARD VIEW', replacement);
}

fs.writeFileSync(file, content, 'utf8');
