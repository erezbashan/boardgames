import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const FireBreathing: CardImplementation = {
  id: 'fire_breathing',
  name: 'Fire Breathing',
  cost: 4,
  type: 'Keep',
  description: 'Your neighbors take 1 extra damage when you deal damage.',
  verified: false,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    // "Neighbors" usually means adjacent in playerOrder.
    if (action.type === 'ATTACK' && action.playerId === pId && action.payload.amount > 0) {
       const order = st.playerOrder.filter(id => st.players[id].health > 0);
       const idx = order.indexOf(pId);
       if (idx !== -1 && order.length > 1) {
          const left = order[(idx - 1 + order.length) % order.length];
          const right = order[(idx + 1) % order.length];
          const neighbors = new Set([left, right]);
          
          neighbors.forEach(nId => {
             st.pendingActions.unshift({ type: 'TAKE_DAMAGE', playerId: nId, payload: { amount: 1 }, affectedByCards: [{cardId: 'fire_breathing', playerId: pId}] });
          });
       }
    }
    return st;
  }
};
