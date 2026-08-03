import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export const RapidHealing: CardImplementation = {
  id: 'rapid_healing',
  name: 'Rapid Healing',
  cost: 3,
  type: 'Keep',
  description: 'Spend 2⚡ at any time to heal 1 damage (Prompts at start of turn or before taking fatal damage).',
  verified: false,
  onPostEvent: (st: KotState, action: PendingAction, pId: string) => {
    // Prompt at start of turn if they are damaged (after UI updates for their turn)
    if (action.type === 'START_TURN' && action.playerId === pId && st.players[pId].energy >= 2 && st.players[pId].health < (st.players[pId].maxHealth || 10)) {
       if (action.payload?._rapidHealingDone) return st;
       
       st.pendingActions.unshift({
          type: 'ASK',
          playerId: pId,
          payload: {
             prompt: {
                playerId: pId,
                text: `Rapid Healing: Spend 2⚡ to heal 1❤️?`,
                options: [
                   { label: 'Yes', action: { type: 'RESPONSE_RAPID_HEALING', playerId: pId, payload: { originalAction: action } } },
                   { label: 'No', action: { type: 'RESPONSE_RAPID_HEALING_NO', playerId: pId, payload: { originalAction: action } } }
                ]
             }
          }
       });
    }
    return st;
  },
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    // Also prompt if they take damage that would kill them (simulate "at any time")
    if (action.type === 'TAKE_DAMAGE' && action.playerId === pId && action.payload.amount >= st.players[pId].health && st.players[pId].energy >= 2) {
       if (action.payload?._rapidHealingDone) return st;
       
       const index = st.pendingActions.findIndex(a => a === action);
       if (index !== -1) {
          st.pendingActions.splice(index, 1);
          st.pendingActions.unshift({
             type: 'ASK',
             playerId: pId,
             payload: {
                prompt: {
                   playerId: pId,
                   text: `Rapid Healing: Spend 2⚡ to heal 1❤️ (and avoid death)?`,
                   options: [
                      { label: 'Yes', action: { type: 'RESPONSE_RAPID_HEALING', playerId: pId, payload: { originalAction: action } } },
                      { label: 'No', action: { type: 'RESPONSE_RAPID_HEALING_NO', playerId: pId, payload: { originalAction: action } } }
                   ]
                }
             }
          });
       }
    }
    
    if (action.type === 'RESPONSE_RAPID_HEALING' && action.playerId === pId) {
       if (st.players[pId].energy >= 2) {
          st.players[pId].energy -= 2;
          st.pendingActions.unshift({ type: 'HEALTH', playerId: pId, payload: { amount: 1 } });
          addLog(st, action, `🩹 ${st.players[pId].name} spent 2⚡ to heal 1❤️ using Rapid Healing`);
          
          // Re-insert original action so they can do it again if needed!
          const nextAction = { ...action.payload.originalAction };
          delete nextAction.skipPreEvent;
          st.pendingActions.push(nextAction);
       } else {
          const nextAction = { ...action.payload.originalAction, payload: { ...action.payload.originalAction.payload, _rapidHealingDone: true } };
          delete nextAction.skipPreEvent;
          st.pendingActions.unshift(nextAction);
       }
    }
    
    if (action.type === 'RESPONSE_RAPID_HEALING_NO' && action.playerId === pId) {
       const nextAction = { ...action.payload.originalAction, payload: { ...action.payload.originalAction.payload, _rapidHealingDone: true } };
       delete nextAction.skipPreEvent;
       st.pendingActions.unshift(nextAction);
    }
    
    return st;
  }
};
