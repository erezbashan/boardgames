import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const EvacuationOrders: CardImplementation = {
  id: 'evacuation_orders',
  name: 'Evacuation Orders',
  cost: 7,
  type: 'Discard',
  description: 'All other monsters lose 5⭐.',
  verified: true,
  onBuy: (st: KotState, action: PendingAction, pId: string) => {
    st.playerOrder.forEach(id => {
      if (id !== pId && st.players[id].health > 0) {
        const amount = Math.min(st.players[id].vp, 5);
        if (amount > 0) {
          st.pendingActions.unshift({ type: 'VP', payload: { amount: -amount }, playerId: id });
        }
      }
    });
    return st;
  }
};