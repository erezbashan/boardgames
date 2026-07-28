import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const AlphaMonster: CardImplementation = {
  id: 'alpha_monster',
  name: 'Alpha Monster',
  cost: 5,
  type: 'Keep',
  description: 'Gain 1⭐ when you attack.',
  verified: false,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'ATTACK' && action.playerId === pId && action.payload.damage > 0) {
      if (!action.payload._alphaMonsterTriggered) {
        action.payload._alphaMonsterTriggered = true;
        st.pendingActions.unshift({ type: 'VP', payload: { amount: 1 }, playerId: pId });
      }
    }
    return st;
  }
};
