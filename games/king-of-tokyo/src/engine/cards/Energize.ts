import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const Energize: CardImplementation = {
  id: 'energize',
  name: 'Energize',
  cost: 8,
  type: 'Discard',
  description: '+ 9⚡',
  verified: true,
  onBuy: (st: KotState, action: PendingAction, pId: string) => {
    st.pendingActions.unshift({ type: 'ENERGY', payload: { amount: 9 }, playerId: pId });
    return st;
  }
};
