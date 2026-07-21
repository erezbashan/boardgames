import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const NationalGuard: CardImplementation = {
  id: 'national_guard',
  name: 'National Guard',
  cost: 3,
  type: 'Discard',
  description: '+2⭐ and take 2 damage.',
  onBuy: (st: KotState, action: PendingAction, pId: string) => {
    st.pendingActions.unshift(
       { type: 'TAKE_DAMAGE', payload: { amount: 2, sourceCard: 'national_guard' }, playerId: pId },
       { type: 'VP', payload: { amount: 2, sourceCard: 'national_guard' }, playerId: pId }
    );
    return st;
  }
};
