const fs = require('fs');
let content = fs.readFileSync('frontend/src/SocketContext.tsx', 'utf8');

content = content.replace(
  `startGame: (gameId: string) => void;`,
  `startGame: (gameId: string, settings?: any) => void;`
);

content = content.replace(
  `startGame: (gameId) => emit(SOCKET_EVENTS.START_GAME, gameId),`,
  `startGame: (gameId, settings) => emit(SOCKET_EVENTS.START_GAME, { gameId, settings }),`
);

fs.writeFileSync('frontend/src/SocketContext.tsx', content, 'utf8');
