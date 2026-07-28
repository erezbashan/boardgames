import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const CornerStore: CardImplementation = {
  id: 'corner_store',
  name: 'Corner Store',
  cost: 3,
  type: 'Discard',
  description: '+ 1⭐',
  onBuy: (st: KotState, action: PendingAction, pId: string) => {
    st.pendingActions.unshift({ type: 'VP', payload: { amount: 1 }, playerId: pId });
    return st;
  }
};
