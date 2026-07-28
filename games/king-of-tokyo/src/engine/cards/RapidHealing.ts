import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const RapidHealing: CardImplementation = {
  id: 'rapid_healing',
  name: 'Rapid Healing',
  cost: 3,
  type: 'Keep',
  description: 'Spend 2⚡ at any time to heal 1 damage.',
  verified: false,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    // "At any time" is hard in turn-based state machines without a persistent button.
    // We will hook it into TAKE_DAMAGE to prompt them if they want to heal instead of dying.
    if (action.type === 'TAKE_DAMAGE' && action.playerId === pId && action.payload.amount >= st.players[pId].health && st.players[pId].energy >= 2) {
      if (!action.payload._rapidHealingPrompted) {
         action.payload._rapidHealingPrompted = true;
         st.pendingActions.unshift({
           type: 'ASK',
           playerId: pId,
           payload: {
             prompt: {
               playerId: pId,
               text: `Rapid Healing: Spend 2⚡ to heal 1? (Lethal damage incoming)`,
               options: [
                 { label: 'Yes', action: { type: 'RESPONSE_RAPID_HEALING', playerId: pId, payload: { originalAction: action } } },
                 { label: 'No', action: { type: 'RESPONSE_RAPID_HEALING_NO', playerId: pId, payload: { originalAction: action } } }
               ]
             }
           }
         });
         const index = st.pendingActions.findIndex(a => a === action);
         if (index > 0) st.pendingActions.splice(index, 1);
      }
    }
    
    if (action.type === 'RESPONSE_RAPID_HEALING' && action.playerId === pId) {
       st.pendingActions.unshift(action.payload.originalAction);
       st.pendingActions.unshift({ type: 'HEAL', playerId: pId, payload: { amount: 1 }, affectedByCards: [{cardId: 'rapid_healing', playerId: pId}] });
       st.pendingActions.unshift({ type: 'ENERGY', playerId: pId, payload: { amount: -2 }, affectedByCards: [{cardId: 'rapid_healing', playerId: pId}] });
    }
    if (action.type === 'RESPONSE_RAPID_HEALING_NO' && action.playerId === pId) {
       st.pendingActions.unshift(action.payload.originalAction);
    }
    return st;
  }
};
