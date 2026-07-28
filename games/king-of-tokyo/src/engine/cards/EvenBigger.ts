import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { getPlayerMaxHealth } from '../utils';

export const EvenBigger: CardImplementation = {
  id: 'even_bigger',
  name: 'Even Bigger',
  cost: 4,
  type: 'Keep',
  description: 'Your maximum health becomes 12. Gain 2❤️ immediately.',
  verified: false,
  onBuy: (st: KotState, action: PendingAction, pId: string) => {
    st.players[pId].maxHealth = 12;
    st.pendingActions.unshift({ type: 'HEALTH', payload: { amount: 2, skipLog: false, reason: 'Even Bigger' }, playerId: pId });
    return st;
  }
};
