import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const Burrowing: CardImplementation = {
  id: 'burrowing',
  name: 'Burrowing',
  cost: 5,
  type: 'Keep',
  description: 'Deal 1 extra damage on Tokyo. Deal 1 damage when yielding Tokyo to the monster taking it.',
  verified: false,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'ATTACK' && action.playerId === pId && st.players[pId].location !== 'Outside') {
      st.pendingActions.unshift({ ...action, payload: { ...action.payload, damage: action.payload.damage + 1 }, affectedByCards: [{cardId: 'burrowing', playerId: pId}] });
      const index = st.pendingActions.findIndex(a => a === action);
      if (index !== -1) st.pendingActions.splice(index, 1);
    }
    if (action.type === 'RESPONSE_YIELD' && action.playerId === pId && action.payload.yield) {
      // Find who attacked to make them yield
      const attackerId = action.payload?.attackerId;
      if (attackerId) {
         st.pendingActions.unshift({
           type: 'TAKE_DAMAGE',
           playerId: attackerId,
           payload: { amount: 1 },
           affectedByCards: [{cardId: 'burrowing', playerId: pId}]
         });
      }
    }
    return st;
  }
};
