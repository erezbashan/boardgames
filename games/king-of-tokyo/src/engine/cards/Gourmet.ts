import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const Gourmet: CardImplementation = {
  id: 'gourmet',
  name: 'Gourmet',
  cost: 4,
  type: 'Keep',
  description: 'When you heal 2 or more ❤️ at once, gain 1⭐.',
  verified: false,
  onPostEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'HEALTH' && action.playerId === pId && action.payload.amount >= 2) {
      st.pendingActions.unshift({ type: 'VP', payload: { amount: 1 }, playerId: pId });
    }
    return st;
  }
};