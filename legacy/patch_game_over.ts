import fs from 'fs';
import path from 'path';

const file = path.join(__dirname, 'backend/src/index.ts');
let content = fs.readFileSync(file, 'utf8');

const checkGameOverStr = `
function checkGameOver(gameId: string): boolean {
  const game = games[gameId];
  if (!game || game.status === 'GameOver') return false;

  const alivePlayers = Object.values(game.players).filter(p => p.health > 0);
  let winner = Object.values(game.players).find(p => p.victoryPoints >= 20);

  if (!winner && alivePlayers.length <= 1 && game.status === 'Playing') {
    winner = alivePlayers[0];
  }

  if (winner || alivePlayers.length === 0) {
    game.status = 'GameOver';
    game.winner = winner ? winner.id : null;
    game.logs.push(winner ? \`🎉 \${winner.name} wins the game!\` : \`💀 Everyone was defeated. The game ends in a draw!\`);
    broadcastState(gameId);
    return true;
  }

  return false;
}
`;

content = content.replace('function endTurnAutomatically(gameId: string, socketId: string) {', checkGameOverStr + '\nfunction endTurnAutomatically(gameId: string, socketId: string) {');

// In startTurn, before broadcasting state, check game over
content = content.replace(
  'broadcastState(gameId);\n  \n  // Phase 3: Heals',
  'broadcastState(gameId);\n  if (checkGameOver(gameId)) return;\n  \n  // Phase 3: Heals'
);

content = content.replace(
  'endTurnAutomatically(gameId, p.id);\n      return;\n    }\n  }',
  'endTurnAutomatically(gameId, p.id);\n      return;\n    }\n  }\n  if (checkGameOver(gameId)) return;'
);

// End of resolveDiceAutomatically (bot logic)
content = content.replace(
  'playBotBuyPhase(gameId, games, broadcastState, endTurnAutomatically);\n    }',
  'if (!checkGameOver(gameId)) {\n      playBotBuyPhase(gameId, games, broadcastState, endTurnAutomatically);\n    }'
);

// Add history recording to endTurnAutomatically
const historyCode = `
  const game = games[gameId];
  if (!game) return;
  
  if (!game.history) game.history = [];
  const currentTurn = game.history.length > 0 ? game.history[game.history.length - 1].turnNumber + 1 : 0;
  Object.values(game.players).forEach(p => {
    game.history!.push({
      turnNumber: currentTurn,
      playerId: p.id,
      vp: p.victoryPoints,
      health: Math.max(0, p.health),
      energy: p.energy
    });
  });
  
  if (checkGameOver(gameId)) return;
`;

content = content.replace('const game = games[gameId];\n  if (!game) return;', historyCode);

fs.writeFileSync(file, content, 'utf8');
