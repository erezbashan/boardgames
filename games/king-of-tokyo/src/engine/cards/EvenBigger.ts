import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { getPlayerMaxHealth } from '../utils';

export const EvenBigger: CardImplementation = {
  id: 'even_bigger',
  name: 'Even Bigger',
  cost: 4,
  type: 'Keep',
  description: 'Your maximum Health is increased by 2. Gain 2❤️ when you buy this card.',
  verified: true,
  onBuy: (st: KotState, action: PendingAction, pId: string) => {
    st.players[pId].maxHealth = (st.players[pId].maxHealth || 10) + 2;
    st.pendingActions.unshift({ type: 'HEALTH', payload: { amount: 2 }, playerId: pId });
    return st;
  }
};
