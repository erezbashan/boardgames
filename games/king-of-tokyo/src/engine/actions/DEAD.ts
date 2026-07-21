import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export function handleDead(st: KotState, action: PendingAction, pId: string) {
   addLog(st, action, `💀 ${st.players[pId].name} died!`);
   
   if (st.players[pId]) {
      st.players[pId].stats.turnDied = st.history.length + 1;
   }

   if (st.players[pId].location === 'TokyoCity') {
       st.players[pId] = { ...st.players[pId], location: 'Outside' };
   }

   const alive = st.playerOrder.filter(id => st.players[id].health > 0);
   if (alive.length <= 1 && alive.length > 0) {
      addLog(st, action, `${st.players[alive[0]].name} is the last monster standing! 🏆`);
      st.status = 'Finished';
      st.winnerId = alive[0];
      st.pendingActions = [];
   }
}
