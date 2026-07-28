import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const EaterOfTheDead: CardImplementation = {
  id: 'eater_of_the_dead',
  name: 'Eater of the Dead',
  cost: 4,
  type: 'Keep',
  description: 'Gain 3⭐ every time a monster reaches 0❤️.',
  verified: true,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    // We trigger on DEAD action before it executes
    if (action.type === 'DEAD') {
      st.pendingActions.unshift({ type: 'VP', payload: { amount: 3 }, playerId: pId });
    }
    return st;
  }
};
