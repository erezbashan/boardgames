import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const Wings: CardImplementation = {
  id: 'wings',
  name: 'Wings',
  cost: 6,
  type: 'Keep',
  description: 'When you take damage, you can spend 2⚡ to ignore it.',
  verified: false,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'TAKE_DAMAGE' && action.playerId === pId && action.payload.amount > 0 && st.players[pId].energy >= 2) {
      if (!action.payload._wingsPrompted) {
        action.payload._wingsPrompted = true;
        
        st.pendingActions.unshift({
          type: 'ASK_QUESTION',
          playerId: pId,
          payload: {
            question: `Spend 2⚡ to evade all damage? (Taking ${action.payload.amount})`,
            options: ['Yes', 'No'],
            onResponse: (response: string) => {
              if (response === 'Yes') {
                return [
                  { type: 'ENERGY', playerId: pId, payload: { amount: -2 }, affectedByCards: [{cardId: 'wings', playerId: pId}] },
                  { ...action, payload: { ...action.payload, amount: 0 }, affectedByCards: [{cardId: 'wings', playerId: pId}] }
                ];
              }
              return [action];
            }
          }
        });
        
        const index = st.pendingActions.findIndex(a => a === action);
        if (index > 0) st.pendingActions.splice(index, 1);
      }
    }
    return st;
  }
};
