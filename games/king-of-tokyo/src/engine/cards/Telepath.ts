import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export const Telepath: CardImplementation = {
  id: 'telepath',
  name: 'Telepath',
  cost: 4,
  type: 'Keep',
  description: 'Spend 1⚡ to get 1 extra reroll.',
  verified: true,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'RESOLVE_ROLLS' && action.playerId === pId && st.players[pId].energy >= 1) {
      if (!action.payload?._telepathPrompted) {
        const index = st.pendingActions.findIndex(a => a === action);
        if (index !== -1) {
          action.payload = action.payload || {};
          action.payload._telepathPrompted = true;
          st.pendingActions.splice(index, 1);
          st.pendingActions.unshift({
            type: 'ASK',
            playerId: pId,
            payload: {
              prompt: {
                playerId: pId,
                text: 'Telepath: Spend 1⚡ for an extra reroll?',
                options: [
                  { label: 'Yes', action: { type: 'RESPONSE_TELEPATH', playerId: pId, payload: { originalAction: action } } },
                  { label: 'No', action: { type: 'RESPONSE_TELEPATH_NO', playerId: pId, payload: { originalAction: action } } }
                ]
              }
            }
          });
        }
      }
    }
    
    if ((action.type === 'RESPONSE_TELEPATH' || action.type === 'USE_TELEPATH') && action.playerId === pId) {
      st.players[pId].energy -= 1;
      st.maxRolls = (st.maxRolls || 3) + 1;
      
      if (action.type === 'RESPONSE_TELEPATH') {
        // Go back to rolling phase
        st.pendingActions.unshift({ type: 'RESOLVE_ROLLS', playerId: pId });
        st.pendingActions.unshift({ type: 'ASK_ROLL', playerId: pId, payload: { prompt: { playerId: pId, text: 'Roll Dice?', options: [] } } });
      } else {
        // Just incremented maxRolls during ASK_ROLL, so nothing else to push, just let ASK_ROLL continue
        st.players[pId].cardState = st.players[pId].cardState || {};
        st.players[pId].cardState.telepathUsed = true;
      }
      addLog(st, action, `${st.players[pId].name} spent 1⚡ for an extra reroll using Telepath`);
    }
    
    if (action.type === 'RESPONSE_TELEPATH_NO' && action.playerId === pId) {
       const nextAction = { ...action.payload.originalAction, affectedByCards: action.payload.originalAction.affectedByCards || [] };
       delete nextAction.skipPreEvent;
       st.pendingActions.unshift(nextAction);
    }
    
    return st;
  }
};