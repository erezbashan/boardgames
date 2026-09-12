const fs = require('fs');
let code = fs.readFileSync('games/king-of-tokyo/src/engine/actions/RESOLVE_ROLLS.ts', 'utf8');

code = code.replace(
  "if (outcomeMap['Smash']) diceActions.push({ type: 'ATTACK', payload: { damage: outcomeMap['Smash'] }, playerId: pId });",
  `if (outcomeMap['Smash']) {
     diceActions.push({ type: 'ATTACK', payload: { damage: outcomeMap['Smash'] }, playerId: pId });
  } else if (st.settings?.secondEditionTokyoRule) {
     const tokyoCityOccupied = st.playerOrder.some(id => st.players[id].location === 'TokyoCity' && st.players[id].health > 0);
     const tokyoBayOccupied = st.playerOrder.some(id => st.players[id].location === 'TokyoBay' && st.players[id].health > 0);
     const totalTokyoSlots = isTokyoBayActive(st) ? 2 : 1;
     let occupiedSlots = 0;
     if (tokyoCityOccupied) occupiedSlots++;
     if (tokyoBayOccupied) occupiedSlots++;

     if (occupiedSlots < totalTokyoSlots && st.players[pId].location === 'Outside') {
        diceActions.push({ type: 'ENTER_TOKYO', playerId: pId });
     }
  }`
);

fs.writeFileSync('games/king-of-tokyo/src/engine/actions/RESOLVE_ROLLS.ts', code);
