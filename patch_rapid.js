const fs = require('fs');
let code = fs.readFileSync('games/king-of-tokyo/src/engine/cards/RapidHealing.ts', 'utf8');

let oldCode = `          if (action.payload.originalAction.type !== 'START_TURN') {
             // Re-insert original action so they can do it again if needed!
             const nextAction = { ...action.payload.originalAction };
             delete nextAction.skipPreEvent;
             st.pendingActions.push(nextAction);
          }`;

let newCode = `          if (action.payload.originalAction.type !== 'START_TURN') {
             // Re-insert original action so they can do it again if needed!
             const nextAction = { ...action.payload.originalAction };
             delete nextAction.skipPreEvent;
             // UNSHIFT so it happens immediately after the HEALTH action!
             st.pendingActions.splice(1, 0, nextAction);
          }`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('games/king-of-tokyo/src/engine/cards/RapidHealing.ts', code);
