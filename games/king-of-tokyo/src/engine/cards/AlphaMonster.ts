import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const AlphaMonster: CardImplementation = {
  id: 'alpha_monster',
  name: 'Alpha Monster',
  cost: 5,
  type: 'Keep',
  description: 'Gain 1⭐ for each 💥 you roll.',
  verified: true,
  onPostEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'RESOLVE_ROLLS' && action.playerId === pId) {
      const smashCount = st.dice.filter(d => d.value === 'Smash').length;
      if (smashCount > 0) {
        st.pendingActions.unshift({ type: 'VP', payload: { amount: smashCount }, playerId: pId });
      }
    }
    return st;
  }
};
