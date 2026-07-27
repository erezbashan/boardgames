import { KotState, PendingAction } from '../types';
import { addLog, getPlayerMaxHealth } from '../utils';

export function handleHealth(st: KotState, action: PendingAction, pId: string) {
  if (st.players[pId]) {
    
    const max = getPlayerMaxHealth(st, pId);
    const actual = Math.min(max - st.players[pId].health, action.payload.amount);
    
    const canHeal = st.players[pId].location !== 'TokyoCity' || !!action.payload.sourceCard;
    
    if (actual > 0 && canHeal) {
      st.players[pId] = { 
         ...st.players[pId], 
         health: st.players[pId].health + actual,
         stats: {
             ...st.players[pId].stats,
             healthHealed: (st.players[pId].stats.healthHealed || 0) + actual
         }
      };
      const reasonStr = action.payload.reason ? ` (${action.payload.reason})` : '';
      addLog(st, action, `${st.players[pId].name} healed ${actual} ❤️${reasonStr}`);
    }
  }
}
