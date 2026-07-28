import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const UrbanLegend: CardImplementation = {
  id: 'urban_legend',
  name: 'Urban Legend',
  cost: 4,
  type: 'Keep',
  description: 'When you gain ⭐, gain 1 extra ⭐.',
  verified: true,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'VP' && action.playerId === pId && action.payload.amount > 0 && !action.affectedByCards?.some(c => c.cardId === 'urban_legend')) {
      action.payload.amount += 1;
      action.affectedByCards = [...(action.affectedByCards || []), { cardId: 'urban_legend', playerId: pId }];
    }
    return st;
  }
};