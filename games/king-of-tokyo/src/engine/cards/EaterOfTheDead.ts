import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const EaterOfTheDead: CardImplementation = {
  id: 'eater_of_the_dead',
  name: 'Eater of the Dead',
  cost: 4,
  type: 'Keep',
  description: 'Gain 1⭐ every time a monster reaches 0❤️.',
  verified: false,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    // We trigger on DEAD action before it executes
    if (action.type === 'DEAD') {
      st.pendingActions.unshift({ type: 'VP', payload: { amount: 1 }, playerId: pId });
    }
    return st;
  }
};
