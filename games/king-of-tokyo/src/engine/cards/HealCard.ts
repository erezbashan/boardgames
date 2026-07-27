import { CardImplementation, KotState, PendingAction } from './types';

export const HealCard: CardImplementation = {
  id: 'heal',
  name: 'Heal',
  cost: 3,
  type: 'Discard',
  description: 'Heal 2 damage.',
  onBuy: (st: KotState, action: PendingAction, pId: string) => {
    st.pendingActions.unshift({ type: 'HEALTH', payload: { amount: 2, sourceCard: 'heal' }, playerId: pId });
  },
};
