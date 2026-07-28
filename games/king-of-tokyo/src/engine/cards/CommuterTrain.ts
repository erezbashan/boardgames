import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const CommuterTrain: CardImplementation = {
  id: 'commuter_train',
  name: 'Commuter Train',
  cost: 4,
  type: 'Discard',
  description: '+ 2⭐',
  onBuy: (st: KotState, action: PendingAction, pId: string) => {
    st.pendingActions.unshift({ type: 'VP', payload: { amount: 2 }, playerId: pId });
    return st;
  }
};
