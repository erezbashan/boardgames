const fs = require('fs');
let code = fs.readFileSync('games/king-of-tokyo/src/engine/reducer.ts', 'utf8');

const tickDelayFunc = `
function getTickDelay(st: KotState): number {
   const aliveHumans = st.playerOrder.filter(id => st.players[id] && st.players[id].health > 0 && !st.players[id].isBot).length;
   if (aliveHumans === 0) return 1;
   
   if (st.settings?.gameSpeed === 'Fast') return 750;
   if (st.settings?.gameSpeed === 'Slow') return 3000;
   return 1500;
}
`;

if (!code.includes('function getTickDelay')) {
   code = code.replace("function doAction", tickDelayFunc + "\\nfunction doAction");
}

code = code.replace(/BACKEND_TICK_DELAY_MS/g, 'getTickDelay(st)');
// Fix the import warning since BACKEND_TICK_DELAY_MS is no longer used but was imported
code = code.replace('import { baseReducer, BACKEND_TICK_DELAY_MS } from', 'import { baseReducer } from');

fs.writeFileSync('games/king-of-tokyo/src/engine/reducer.ts', code);
