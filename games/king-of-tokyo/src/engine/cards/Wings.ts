import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const Wings: CardImplementation = {
  id: 'wings',
  name: 'Wings',
  cost: 6,
  type: 'Keep',
  description: 'When you take damage, you can spend 2⚡ to ignore it.',
  verified: true,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'TAKE_DAMAGE' && action.playerId === pId && action.payload.amount > 0 && st.players[pId].energy >= 2) {
      if (!action.payload._wingsPrompted) {
        action.payload._wingsPrompted = true;
        
        st.pendingActions.unshift({
          type: 'ASK',
          playerId: pId,
          payload: {
            prompt: {
              playerId: pId,
              text: `Wings: Spend 2⚡ to evade all damage? (Taking ${action.payload.amount})`,
              options: [
                { label: 'Yes', action: { type: 'RESPONSE_WINGS', playerId: pId, payload: { originalAction: action } } },
                { label: 'No', action: { type: 'RESPONSE_WINGS_NO', playerId: pId, payload: { originalAction: action } } }
              ]
            }
          }
        });
        
        const index = st.pendingActions.findIndex(a => a === action);
        if (index !== -1) st.pendingActions.splice(index, 1);
      }
    }

    if (action.type === 'RESPONSE_WINGS' && action.playerId === pId) {
      const orig = action.payload.originalAction;
      st.pendingActions.unshift(
        { ...orig, payload: { ...orig.payload, amount: 0 }, affectedByCards: [{cardId: 'wings', playerId: pId}] }
      );
      st.pendingActions.unshift(
        { type: 'ENERGY', playerId: pId, payload: { amount: -2 }, affectedByCards: [{cardId: 'wings', playerId: pId}] }
      );
    }

    if (action.type === 'RESPONSE_WINGS_NO' && action.playerId === pId) {
      st.pendingActions.unshift(action.payload.originalAction);
    }
    
    return st;
  }
};
