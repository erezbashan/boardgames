import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

import { CARD_REGISTRY } from '../cards/registry';

export function handleEnergy(st: KotState, action: PendingAction, pId: string) {
  if (st.players[pId]) {
    st.players[pId] = { 
       ...st.players[pId], 
       energy: st.players[pId].energy + action.payload.amount,
       stats: {
           ...st.players[pId].stats,
           energyGained: (st.players[pId].stats.energyGained || 0) + (action.payload.amount > 0 ? action.payload.amount : 0)
       }
    };
    
    let sourceText = '';
    if (action.payload.sourceCard && CARD_REGISTRY[action.payload.sourceCard]) {
       sourceText = ` via ${CARD_REGISTRY[action.payload.sourceCard].name}`;
    }
    
    const reasonStr = action.payload.reason ? ` (${action.payload.reason})` : '';
    
    const amt = action.payload.amount;
    if (amt >= 0) {
       addLog(st, action, `${st.players[pId].name} gained ${amt} ⚡${reasonStr}${sourceText}`);
    } else {
       addLog(st, action, `${st.players[pId].name} lost ${Math.abs(amt)} ⚡${reasonStr}${sourceText}`);
    }
  }
}
