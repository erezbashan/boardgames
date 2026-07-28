import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { getPlayerMaxHealth } from '../utils';

export const EvenBigger: CardImplementation = {
  id: 'even_bigger',
  name: 'Even Bigger',
  cost: 4,
  type: 'Keep',
  description: 'Your maximum health becomes 12. Gain 2❤️ immediately.',
  onBuy: (st: KotState, action: PendingAction, pId: string) => {
    // Actually we don't need to pass maxHealth in onBuy because utils.getPlayerMaxHealth handles the 12 cap.
    // We just heal them by 2 (which can now go up to 12).
    st.pendingActions.unshift({ type: 'HEALTH', payload: { amount: 2, skipLog: false, reason: 'Even Bigger' }, playerId: pId });
    return st;
  },
  getMaxHealth: (st: KotState, pId: string) => {
    return 12;
  }
};
