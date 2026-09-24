const fs = require('fs');
const file = 'games/acquire/src/engine/reducer.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /if \(action\.type === 'START_GAME'\) \{\n\s*newState = startGame\(newState\);\n\s*\}/;
const replacement = `if (action.type === 'START_GAME') {
      newState = startGame(newState);
    } else if (action.type === 'NEW_GAME') {
      const freshGame = createInitialGameState('');
      newState = {
        ...newState,
        ...freshGame,
        players: newState.players, // already stripped of bots by baseReducer
        playerOrder: newState.playerOrder,
        history: [],
      };
      
      for (const id in newState.players) {
        newState.players[id] = {
          ...newState.players[id],
          money: 6000,
          tiles: [],
          stocks: { Tower: 0, Luxor: 0, American: 0, Worldwide: 0, Festival: 0, Imperial: 0, Continental: 0 },
          stats: { chainsFounded: 0, mergesCaused: 0, firstBonuses: 0, secondBonuses: 0, sharesBought: 0 }
        };
      }
    }`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
