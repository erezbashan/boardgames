import fs from 'fs';
import path from 'path';

const file = path.join(__dirname, 'backend/src/index.ts');
let content = fs.readFileSync(file, 'utf8');

const returnToLobbyHandler = `
  socket.on(SOCKET_EVENTS.RETURN_TO_LOBBY, (gameId: string) => {
    const game = games[gameId];
    if (game && game.status === 'GameOver') {
      game.status = 'Lobby';
      game.winner = null;
      game.history = [];
      game.logs = ['Game returned to lobby'];
      Object.values(game.players).forEach(p => {
        p.health = 10;
        p.victoryPoints = 0;
        p.energy = 0;
        p.inTokyo = false;
        p.cards = [];
        p.poisonTokens = 0;
      });
      game.currentTurnPlayerId = null;
      broadcastState(gameId);
    }
  });
`;

content = content.replace('socket.on(SOCKET_EVENTS.START_GAME, (gameId: string) => {', returnToLobbyHandler + '\n  socket.on(SOCKET_EVENTS.START_GAME, (gameId: string) => {');

fs.writeFileSync(file, content, 'utf8');
