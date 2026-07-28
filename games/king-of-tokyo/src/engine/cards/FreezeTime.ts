import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export const FreezeTime: CardImplementation = {
  id: 'freeze_time',
  name: 'Freeze Time',
  cost: 5,
  type: 'Keep',
  description: 'On a turn where you score 1️⃣1️⃣1️⃣, you can take another turn with one less die.',
  verified: true,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'START_TURN' && action.playerId === pId) {
      st.players[pId].cardState = st.players[pId].cardState || {};
      st.players[pId].cardState.freezeTimeEarnedThisTurn = false;
    }
    if (action.type === 'RESOLVE_ROLLS' && action.playerId === pId) {
      const counts: Record<string, number> = {};
      st.dice.forEach(d => { counts[d.value] = (counts[d.value] || 0) + 1; });
      if (counts['1'] >= 3) {
         st.players[pId].cardState = st.players[pId].cardState || {};
         if (!st.players[pId].cardState.freezeTimeEarnedThisTurn) {
            st.players[pId].cardState.freezeTimeEarnedThisTurn = true;
            st.players[pId].cardState.freezeTimeExtraTurn = true;
            st.players[pId].markers = st.players[pId].markers || {};
            st.players[pId].markers.extra_turn = (st.players[pId].markers.extra_turn || 0) + 1;
            addLog(st, action, `${st.players[pId].name} scored 1️⃣1️⃣1️⃣ and gets an extra turn from Freeze Time!`);
         }
      }
    }
    return st;
  },
  onPostEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'SETUP_DICE' && action.playerId === pId) {
       const state = st.players[pId].cardState || {};
       if (state.freezeTimeExtraTurn) {
          state.freezeTimeExtraTurn = false;
          if (st.dice.length > 0) {
             st.dice.pop();
          }
       }
    }
    return st;
  }
};
