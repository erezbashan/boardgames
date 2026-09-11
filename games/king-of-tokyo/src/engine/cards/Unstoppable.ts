import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const Unstoppable: CardImplementation = {
  id: 'unstoppable',
  name: 'Unstoppable',
  cost: 4,
  type: 'Keep',
  description: 'You can heal while in Tokyo.',
  verified: true,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'HEALTH' && action.playerId === pId) {
      // Only trigger if they are actually in Tokyo, otherwise they can heal normally and we don't want to spam the log
      if (st.players[pId].location.startsWith('Tokyo')) {
        action.affectedByCards = [...(action.affectedByCards || []), { cardId: 'unstoppable', playerId: pId }];
      }
    }
    return st;
  }
};