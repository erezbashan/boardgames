import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const GasRefinery: CardImplementation = {
  id: 'gas_refinery',
  name: 'Gas Refinery',
  cost: 6,
  type: 'Discard',
  description: '+ 2⭐ and all other monsters take 3 damage.',
  verified: true,
  onBuy: (st: KotState, action: PendingAction, pId: string) => {
    st.pendingActions.unshift({ type: 'VP', payload: { amount: 2 }, playerId: pId });
    st.playerOrder.forEach((id: string) => {
      if (id !== pId && st.players[id].health > 0) {
         st.pendingActions.unshift({ type: 'TAKE_DAMAGE', payload: { amount: 3 }, playerId: id });
      }
    });
    return st;
  },
};
