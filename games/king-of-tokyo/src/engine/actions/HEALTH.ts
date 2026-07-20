import { KotState, PendingAction } from '../types';
import { addLog, getPlayerMaxHealth } from '../utils';

export function handleHealth(st: KotState, action: PendingAction, pId: string) {
  if (st.players[pId]) {
    
    const max = getPlayerMaxHealth(st, pId);
    const actual = Math.min(max - st.players[pId].health, action.payload.amount);
    if (actual > 0 && st.players[pId].location !== 'TokyoCity') {
      st.players[pId] = { ...st.players[pId], health: st.players[pId].health + actual };
      st.players[pId].stats.healthHealed += actual;
      addLog(st, action, `${st.players[pId].name} healed ${actual} ❤️`);
    }
  }
}
