import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export function handleVP(st: KotState, action: PendingAction, pId: string) {
  if (st.players[pId]) {
    st.players[pId] = { ...st.players[pId], vp: st.players[pId].vp + action.payload.amount };
    addLog(st, action, `${st.players[pId].name} gained ${action.payload.amount} ⭐`);
    if (st.players[pId].vp >= st.settings.maxVp) {
      addLog(st, action, `${st.players[pId].name} wins on VP! 🏆`);
      st.status = 'Finished';
      st.winnerId = pId;
    }
  }
}
