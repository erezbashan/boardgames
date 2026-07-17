const fs = require('fs');
let content = fs.readFileSync('backend/src/index.ts', 'utf8');

content = content.replace(
  `socket.on(SOCKET_EVENTS.START_GAME, (gameId: string) => {
    const game = games[gameId];`,
  `socket.on(SOCKET_EVENTS.START_GAME, (payload: any) => {
    const gameId = typeof payload === 'string' ? payload : payload.gameId;
    const settings = typeof payload === 'string' ? undefined : payload.settings;
    const game = games[gameId];
    if (game && settings) {
      game.settings = { ...game.settings, ...settings };
    }`
);

fs.writeFileSync('backend/src/index.ts', content, 'utf8');
