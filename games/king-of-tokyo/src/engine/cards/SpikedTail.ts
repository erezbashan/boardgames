import { CardImplementation } from './types';

export const SpikedTail: CardImplementation = {
  id: 'spiked_tail',
  name: 'Spiked Tail',
  cost: 5,
  type: 'Keep',
  description: 'When you attack deal 1 extra damage.',
  onPreEvent: (st, action, pId) => {
    if (action.type === 'ATTACK' && action.playerId === pId && action.payload.damage > 0) {
      action.payload.damage += 1;
      action.payload.reason = action.payload.reason ? action.payload.reason + ', Spiked Tail' : 'Spiked Tail';
    }
    return st;
  }
};
