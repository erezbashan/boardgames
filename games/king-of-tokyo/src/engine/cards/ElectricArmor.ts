import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const ElectricArmor: CardImplementation = {
  id: 'electric_armor',
  name: 'Electric Armor',
  cost: 4,
  type: 'Keep',
  description: 'When you take damage, you can spend 1⚡ to reduce it by 1.',
  verified: false,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'TAKE_DAMAGE' && action.playerId === pId && action.payload.amount > 0 && st.players[pId].energy >= 1) {
      if (!action.payload._electricArmorPrompted) {
        action.payload._electricArmorPrompted = true;
        
        st.pendingActions.unshift({
          type: 'ASK_QUESTION',
          playerId: pId,
          payload: {
            question: `Spend 1⚡ to reduce damage by 1? (Taking ${action.payload.amount})`,
            options: ['Yes', 'No'],
            onResponse: (response: string) => {
              if (response === 'Yes') {
                return [
                  { type: 'ENERGY', playerId: pId, payload: { amount: -1 }, affectedByCards: [{cardId: 'electric_armor', playerId: pId}] },
                  { ...action, payload: { ...action.payload, amount: action.payload.amount - 1 }, affectedByCards: [{cardId: 'electric_armor', playerId: pId}] }
                ];
              }
              return [action];
            }
          }
        });
        
        // Remove the original TAKE_DAMAGE action as we pushed ASK_QUESTION
        const index = st.pendingActions.findIndex(a => a === action);
        if (index > 0) st.pendingActions.splice(index, 1);
      }
    }
    return st;
  }
};