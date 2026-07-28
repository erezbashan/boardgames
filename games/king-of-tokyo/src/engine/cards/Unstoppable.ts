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
      // By adding Unstoppable to affectedByCards, HEALTH.ts will consider it isFromCard and allow healing!
      action.affectedByCards = [...(action.affectedByCards || []), { cardId: 'unstoppable', playerId: pId }];
    }
    return st;
  }
};