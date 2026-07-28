import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const SuperJump: CardImplementation = {
  id: 'super_jump',
  name: 'Super Jump',
  cost: 4,
  type: 'Keep',
  description: 'Take 1 less damage from all attacks.',
  verified: true,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'TAKE_DAMAGE' && action.playerId === pId && action.payload.amount > 0) {
      action.payload.amount -= 1;
      action.affectedByCards = [...(action.affectedByCards || []), { cardId: 'super_jump', playerId: pId }];
    }
    return st;
  }
};