import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const Evade: CardImplementation = {
  id: 'evade',
  name: 'Evade',
  cost: 7,
  type: 'Keep',
  description: 'When you take 1 or more damage, you can spend 1⚡ to take 1 less damage.',
  verified: true,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'TAKE_DAMAGE' && action.playerId === pId) {
      if (st.players[pId] && st.players[pId].cards.includes('evade') && action.payload.amount > 0 && st.players[pId].energy >= 1) {
        
        // Prevent infinite loops or re-asking for the same damage event
        if (action.payload._evadePrompted) {
            return st;
        }
        
        action.payload._evadePrompted = true;
        
        const reduceDamageAction: PendingAction = {
          type: 'RESPONSE_MULTIPLE_ACTIONS',
          playerId: pId,
          payload: {
            actions: [
              { type: 'ENERGY', playerId: pId, payload: { amount: -1 }, affectedByCards: [{cardId: 'evade', playerId: pId}] },
              { ...action, payload: { ...action.payload, amount: action.payload.amount - 1 }, affectedByCards: [{cardId: 'evade', playerId: pId}] }
            ]
          }
        };

        const takeDamageAction: PendingAction = {
          type: 'RESPONSE_MULTIPLE_ACTIONS',
          playerId: pId,
          payload: {
            actions: [
              { ...action }
            ]
          }
        };

        st.pendingActions.shift(); // Remove the current TAKE_DAMAGE action

        st.pendingActions.unshift({
          type: 'ASK',
          playerId: pId,
          payload: {
            prompt: {
              text: `Spend 1 ⚡ to Evade 1 damage? (Taking ${action.payload.amount})`,
              playerId: pId,
              options: [
                { label: 'Yes', action: reduceDamageAction },
                { label: 'No', action: takeDamageAction },
              ]
            }
          }
        });
      }
    }
    return st;
  }
};
