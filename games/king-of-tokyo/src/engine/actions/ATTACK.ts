import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export function handleAttack(st: KotState, action: PendingAction, pId: string) {
  const attacker = st.players[pId];
  const damage = action.payload.damage;
  addLog(st, action, `${attacker.name} attacks for ${damage}!`);

  const actionsToPush: PendingAction[] = [];

  if (attacker.location === 'Outside') {
     const tokyoPlayers = st.playerOrder.filter(id => st.players[id].location === 'TokyoCity' && st.players[id].health > 0);
     if (tokyoPlayers.length === 0) {
        actionsToPush.push({ type: 'ENTER_TOKYO', playerId: pId });
     } else {
        tokyoPlayers.forEach(tId => {
           actionsToPush.push({ type: 'TAKE_DAMAGE', payload: { amount: damage }, playerId: tId });
           actionsToPush.push({ type: 'ASK', payload: {
              prompt: {
                playerId: tId,
                text: `Will you yield Tokyo?`,
              options: [
                { label: 'Yield', action: { type: 'RESPONSE_YIELD', payload: { yield: true, attackerId: pId } } },
                { label: 'Stay', action: { type: 'RESPONSE_YIELD', payload: { yield: false } } }
              ]
              }
           }});
        });
     }
  } else {
     st.playerOrder.forEach(tId => {
        if (tId !== pId && st.players[tId].location === 'Outside' && st.players[tId].health > 0) {
           actionsToPush.push({ type: 'TAKE_DAMAGE', payload: { amount: damage }, playerId: tId });
        }
     });
  }

  st.pendingActions = [...actionsToPush, ...st.pendingActions];
}
