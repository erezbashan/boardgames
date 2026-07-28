import { CardImplementation } from './types';
import { addLog } from '../utils';

export const Regeneration: CardImplementation = {
  id: 'regeneration',
  name: 'Regeneration',
  cost: 4,
  type: 'Keep',
  description: 'When you heal, heal 1 extra damage.',
  verified: true,
  onPreEvent: (st, action, pId) => {
    if (action.type === 'HEALTH' && action.playerId === pId && action.payload.amount > 0) {
      action.payload.amount += 1;
      action.payload.reason = 'Regeneration';
    }
    return st;
  }
};
