import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const HerdCuller: CardImplementation = {
  id: 'herd_culler',
  name: 'Herd Culler',
  cost: 3,
  type: 'Keep',
  description: 'You can change one of your dice to a [1] each turn.',
  verified: false,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    // Requires UI for changing a die. Similar to Plot Twist.
    return st;
  }
};
