import { CardImplementation } from './types';
import { PendingAction } from '../types';
import { addLog } from '../utils';

export const NovaBreath: CardImplementation = {
  id: 'nova_breath',
  name: 'Nova Breath',
  cost: 7,
  type: 'Keep',
  description: 'Your attacks damage all other monsters.',
  verified: true,
  onPreEvent: (st, action, pId) => {
    if (action.type === 'ATTACK' && action.playerId === pId) {
      const damage = action.payload.damage;
      addLog(st, action, `${st.players[pId].name} attacks for ${damage} everywhere! (Nova Breath)`);
      const actionsToPush: PendingAction[] = [];
      const tokyoPlayers = st.playerOrder.filter(id => st.players[id].location === 'TokyoCity' && st.players[id].health > 0);
      
      if (st.players[pId].location === 'Outside' && tokyoPlayers.length === 0) {
         // Tokyo is empty, attacker must enter Tokyo.
         actionsToPush.push({ type: 'ENTER_TOKYO', playerId: pId });
      }

      st.playerOrder.forEach(tId => {
         if (tId !== pId && st.players[tId].health > 0) {
            const isTokyo = st.players[tId].location === 'TokyoCity';
            // Only deal damage if target is in Tokyo, OR if target is outside and we are outside? No, Nova Breath damages EVERYONE.
            actionsToPush.push({ type: 'TAKE_DAMAGE', payload: { amount: damage, yield_after: isTokyo && st.players[pId].location === 'Outside', attackerId: pId }, playerId: tId });
         }
      });
      // Replace original ATTACK with NOP
      action.type = 'NOP';
      st.pendingActions = [...actionsToPush, ...st.pendingActions];
    }
    return st;
  }
};
