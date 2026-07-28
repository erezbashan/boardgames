import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const HealingRay: CardImplementation = {
  id: 'healing_ray',
  name: 'Healing Ray',
  cost: 4,
  type: 'Keep',
  description: 'You can heal other monsters with your [Heart] results. They must pay you 2⚡ for each damage you heal.',
  verified: false,
  // Complex interaction: asking other players to pay. Skip full implementation for now and implement as a placeholder that asks if you want to heal someone.
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    return st;
  }
};
