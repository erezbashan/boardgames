import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const FriendOfChildren: CardImplementation = {
  id: 'friend_of_children',
  name: 'Friend of Children',
  cost: 3,
  type: 'Keep',
  description: 'When you gain ⚡, gain 1 extra ⚡.',
  verified: false,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'ENERGY' && action.playerId === pId && action.payload.amount > 0 && !action.affectedByCards?.some(c => c.cardId === 'friend_of_children')) {
      action.payload.amount += 1;
      action.affectedByCards = [...(action.affectedByCards || []), { cardId: 'friend_of_children', playerId: pId }];
    }
    return st;
  }
};