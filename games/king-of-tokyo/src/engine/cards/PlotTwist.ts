import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export const PlotTwist: CardImplementation = {
  id: 'plot_twist',
  name: 'Plot Twist',
  cost: 3,
  type: 'Keep',
  description: 'Change one die to any result. Discard when used.',
  verified: false,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    // Complex UI required to pick a die and a result. 
    return st;
  }
};
