import { CardImplementation } from './types';

export const Army: CardImplementation = {
  id: 'army',
  name: 'Army',
  cost: 2,
  type: 'Discard',
  description: '+ 1⭐ and suffer 1 damage for each card you have.',
  onBuy: (st, action, pId) => {
    const cardCount = st.players[pId].cards.length;
    if (cardCount > 0) {
      st.pendingActions.unshift({ type: 'TAKE_DAMAGE', payload: { damage: cardCount, reason: 'Army' }, playerId: pId });
      st.pendingActions.unshift({ type: 'VP', payload: { amount: cardCount, reason: 'Army' }, playerId: pId });
    }
    return st;
  }
};
