import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const Skyscraper: CardImplementation = {
  id: 'skyscraper',
  name: 'Skyscraper',
  cost: 6,
  type: 'Discard',
  description: '+4⭐',
  onBuy: (st: KotState, action: PendingAction, pId: string) => {
    st.pendingActions.unshift({ type: 'VP', payload: { amount: 4, sourceCard: 'skyscraper' }, playerId: pId });
    return st;
  }
};
