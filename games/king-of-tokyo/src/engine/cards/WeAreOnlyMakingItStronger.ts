import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const WeAreOnlyMakingItStronger: CardImplementation = {
  id: 'were_only_making_it_stronger',
  name: "We're Only Making it Stronger",
  cost: 3,
  type: 'Keep',
  description: 'When you lose 2❤️ or more, gain 1⚡.',
  onPostEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'TAKE_DAMAGE' && action.playerId === pId) {
      if (action.payload._actualDamageTaken >= 2) {
        st.pendingActions.unshift({ type: 'ENERGY', payload: { amount: 1 }, playerId: pId });
      }
    }
  },
};
