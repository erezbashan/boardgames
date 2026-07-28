import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const CompleteDestruction: CardImplementation = {
  id: 'complete_destruction',
  name: 'Complete Destruction',
  cost: 3,
  type: 'Keep',
  description: 'If you roll 1, 2, 3, ❤️, 💥, and ⚡ gain 9⭐.',
  onPostEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'RESOLVE_ROLLS' && action.playerId === pId) {
      const faces = new Set(st.dice.map(d => d.value));
      if (faces.size === 6) { // Since there are exactly 6 faces, having all 6 means they rolled one of each!
        st.pendingActions.unshift({ type: 'VP', payload: { amount: 9 }, playerId: pId });
      }
    }
    return st;
  }
};
