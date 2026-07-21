import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const Tanks: CardImplementation = {
  id: 'tanks',
  name: 'Tanks',
  cost: 4,
  type: 'Discard',
  description: '+4⭐ and take 3 damage.',
  onBuy: (st: KotState, action: PendingAction, pId: string) => {
    st.pendingActions.unshift(
       { type: 'TAKE_DAMAGE', payload: { amount: 3, sourceCard: 'tanks' }, playerId: pId },
       { type: 'VP', payload: { amount: 4, sourceCard: 'tanks' }, playerId: pId }
    );
    return st;
  }
};
