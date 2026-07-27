import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export function handleTakeDamage(st: KotState, action: PendingAction, pId: string) {
  const targetId = pId;
  const dmg = action.payload.amount;
  if (st.players[targetId] && st.players[targetId].health > 0) {
     const actualDamageTaken = Math.min(st.players[targetId].health, dmg);
     const newHealth = st.players[targetId].health - actualDamageTaken;
     st.players[targetId] = { ...st.players[targetId], health: newHealth };
     action.payload._actualDamageTaken = actualDamageTaken;
     addLog(st, action, `${st.players[targetId].name} took ${dmg} 💥`);
     
     if (action.payload.attackerId && st.players[action.payload.attackerId]) {
         const attacker = st.players[action.payload.attackerId];
         st.players[action.payload.attackerId] = {
             ...attacker,
             stats: {
                 ...attacker.stats,
                 damageDealt: (attacker.stats.damageDealt || 0) + actualDamageTaken,
                 playersKilled: (attacker.stats.playersKilled || 0) + (newHealth === 0 ? 1 : 0)
             }
         };
     }

     if (newHealth === 0) {
        if (action.payload.yield_after && action.payload.attackerId) {
           st.pendingActions.unshift({ type: 'ENTER_TOKYO', playerId: action.payload.attackerId });
        }
        st.pendingActions.unshift({ type: 'DEAD', playerId: targetId });
     } else if (action.payload.yield_after) {
        st.pendingActions.unshift({ type: 'ASK', payload: {
           prompt: {
              playerId: targetId,
              text: `Will you yield Tokyo?`,
              options: [
                 { label: 'Yield', action: { type: 'RESPONSE_YIELD', payload: { yield: true, attackerId: action.payload.attackerId }, playerId: targetId } },
                 { label: 'Stay', action: { type: 'RESPONSE_YIELD', payload: { yield: false }, playerId: targetId } }
              ]
           }
        }});
     }
  }
}
