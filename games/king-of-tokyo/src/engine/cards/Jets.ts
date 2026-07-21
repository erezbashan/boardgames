import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export const Jets: CardImplementation = {
  id: 'jets',
  name: 'Jets',
  cost: 5,
  type: 'Keep',
  description: 'You suffer no damage when yielding Tokyo.',
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    // Log intercept for Jets usage
    if (action.type === 'LOG_JETS' && action.playerId === pId) {
       addLog(st, action, `🛩️ ${st.players[pId].name} used Jets to avoid damage while yielding!`);
       action.type = 'NOP';
       return st;
    }

    // Intercept TAKE_DAMAGE if it includes a yield_after prompt
    if (action.type === 'TAKE_DAMAGE' && action.playerId === pId && action.payload.yield_after) {
         st.pendingActions.unshift({ type: 'ASK', payload: {
            prompt: {
               playerId: pId,
               text: `Will you yield Tokyo to avoid damage?`,
               options: [
                  { label: 'Yield', action: { type: 'RESPONSE_MULTIPLE_ACTIONS', payload: { actions: [
                     { type: 'LOG_JETS', playerId: pId },
                     { type: 'RESPONSE_YIELD', payload: { yield: true, attackerId: action.payload.attackerId } }
                  ]}} },
                  { label: 'Stay', action: { type: 'RESPONSE_MULTIPLE_ACTIONS', payload: { actions: [
                     { type: 'RESPONSE_YIELD', payload: { yield: false } },
                     { type: 'TAKE_DAMAGE', payload: { amount: action.payload.amount, yield_after: false }, playerId: pId }
                  ]}} }
               ]
            }
         }});
         action.type = 'NOP'; // Skip this damage entirely, we replaced it!
         return st;
    }
    
    return st;
  }
};
