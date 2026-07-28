import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const ArmorPlating: CardImplementation = {
  id: 'armor_plating',
  name: 'Armor Plating',
  cost: 4,
  type: 'Keep',
  description: 'Ignore damage of 1.',
  verified: false,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'TAKE_DAMAGE' && action.playerId === pId && action.payload.amount === 1) {
      action.payload.amount = 0;
      action.affectedByCards = [...(action.affectedByCards || []), { cardId: 'armor_plating', playerId: pId }];
    }
    return st;
  }
};
