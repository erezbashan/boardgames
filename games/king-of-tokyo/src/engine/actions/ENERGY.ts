import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export function handleEnergy(st: KotState, action: PendingAction, pId: string) {
  if (st.players[pId]) {
    st.players[pId] = { ...st.players[pId], energy: st.players[pId].energy + action.payload.amount };
    if (action.payload.amount > 0) st.players[pId].stats.energyGained += action.payload.amount;
    addLog(st, action, `${st.players[pId].name} gained ${action.payload.amount} ⚡`);
  }
}
