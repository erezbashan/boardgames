import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export function handleDead(st: KotState, action: PendingAction, pId: string) {
   addLog(st, action, `💀 ${st.players[pId].name} died`);
   
   if (st.players[pId]) {
      st.players[pId].stats.turnDied = st.history.length + 1;
   }

   if (st.players[pId].location.startsWith('Tokyo')) {
       st.players[pId] = { ...st.players[pId], location: 'Outside' };
   }

   const alive = st.playerOrder.filter(id => st.players[id].health > 0);
   const { isTokyoBayActive } = require('../utils');
   
   if (!isTokyoBayActive(st)) {
      // Tokyo Bay is closed. Evict anyone in it.
      const bayOccupant = st.playerOrder.find(id => st.players[id].location === 'TokyoBay' && st.players[id].health > 0);
      if (bayOccupant) {
         const cityOccupant = st.playerOrder.find(id => st.players[id].location === 'TokyoCity' && st.players[id].health > 0);
         if (!cityOccupant) {
            st.players[bayOccupant] = { ...st.players[bayOccupant], location: 'TokyoCity' };
            addLog(st, action, `${st.players[bayOccupant].name} moved from Tokyo Bay to Tokyo City (Bay closed)`);
         } else {
            st.players[bayOccupant] = { ...st.players[bayOccupant], location: 'Outside' };
            addLog(st, action, `${st.players[bayOccupant].name} yielded Tokyo Bay (Bay closed)`);
         }
      }
   }

   const alive = st.playerOrder.filter(id => st.players[id].health > 0);
   if (alive.length <= 1 && alive.length > 0) {
      addLog(st, action, `${st.players[alive[0]].name} is the last monster standing 🏆`);
      st.status = 'Finished';
      st.winnerId = alive[0];
      st.pendingActions = [];
   }
}
