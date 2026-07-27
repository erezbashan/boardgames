import { CardImplementation, KotState, PendingAction } from './types';

export const GasRefinery: CardImplementation = {
  id: 'gas_refinery',
  name: 'Gas Refinery',
  cost: 6,
  type: 'Discard',
  description: '+ 2⭐ and all other monsters take 3 damage.',
  onBuy: (st: KotState, action: PendingAction, pId: string) => {
    st.pendingActions.unshift({ type: 'VP', payload: { amount: 2 }, playerId: pId });
    
    const others = st.playerOrder.filter(id => id !== pId && st.players[id].health > 0);
    for (const tId of others) {
        st.pendingActions.unshift({ type: 'TAKE_DAMAGE', payload: { amount: 3, attackerId: pId }, playerId: tId });
    }
  },
};
