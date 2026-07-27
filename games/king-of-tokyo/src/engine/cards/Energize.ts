import { CardImplementation, KotState, PendingAction } from './types';

export const Energize: CardImplementation = {
  id: 'energize',
  name: 'Energize',
  cost: 8,
  type: 'Discard',
  description: '+ 9⚡',
  onBuy: (st: KotState, action: PendingAction, pId: string) => {
    st.pendingActions.unshift({ type: 'ENERGY', payload: { amount: 9 }, playerId: pId });
  },
};
