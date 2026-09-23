const fs = require('fs');
let code = fs.readFileSync('games/king-of-tokyo/src/engine/cards/SmokeCloud.ts', 'utf8');

code = code.replace(
  `          // Go back to rolling phase
          st.pendingActions.unshift({ type: 'RESOLVE_ROLLS', playerId: pId, payload: { ...action.payload.originalAction.payload, _smokeCloudPrompted: true } });
          st.pendingActions.unshift({ type: 'ASK_ROLL', playerId: pId, payload: { prompt: { playerId: pId, text: 'Roll Dice?', options: [] } } });`,
  `          // Go back to rolling phase
          const nextResolve = { ...action.payload.originalAction, payload: { ...action.payload.originalAction.payload } };
          delete nextResolve.payload._smokeCloudPrompted;
          delete nextResolve.skipPreEvent;
          st.pendingActions.unshift(nextResolve);
          st.pendingActions.unshift({ type: 'ASK_ROLL', playerId: pId, payload: { prompt: { playerId: pId, text: 'Roll Dice?', options: [] } } });`
);

fs.writeFileSync('games/king-of-tokyo/src/engine/cards/SmokeCloud.ts', code);
