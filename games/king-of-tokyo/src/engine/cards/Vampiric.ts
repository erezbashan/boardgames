import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const Vampiric: CardImplementation = {
  id: 'vampiric',
  name: 'Vampiric',
  cost: 4,
  type: 'Keep',
  description: 'When you damage another monster, heal 1❤️.',
  verified: false,
  onPostEvent: (st: KotState, action: PendingAction, pId: string) => {
    // If we trigger ATTACK and it deals damage
    if (action.type === 'ATTACK' && action.playerId === pId && action.payload.damage > 0) {
      st.pendingActions.unshift({ type: 'HEALTH', payload: { amount: 1 }, playerId: pId });
    }
    return st;
  }
};