import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const FreezeTime: CardImplementation = {
  id: 'freeze_time',
  name: 'Freeze Time',
  cost: 5,
  type: 'Keep',
  description: 'On a turn where you score [1][1][1], you can take another turn with one less die.',
  verified: false,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'START_TURN' && action.playerId === pId) {
      st.players[pId].cardState = st.players[pId].cardState || {};
      st.players[pId].cardState.freezeTimeActive = false;
    }
    if (action.type === 'SCORE_DICE' && action.playerId === pId) {
      const counts = action.payload.counts;
      if (counts['1'] >= 3) {
         st.players[pId].cardState = st.players[pId].cardState || {};
         st.players[pId].cardState.freezeTimeActive = true;
      }
    }
    if (action.type === 'END_TURN' && action.playerId === pId) {
       const state = st.players[pId].cardState || {};
       if (state.freezeTimeActive) {
          state.freezeTimeActive = false;
          // Needs engine support for taking another turn. Since we don't have a built in "extra turn" action, 
          // we inject a custom action that sets the next player to be this player again.
          st.pendingActions.unshift({ type: 'FREEZE_TIME_EXTRA_TURN', playerId: pId });
       }
    }
    if (action.type === 'FREEZE_TIME_EXTRA_TURN' && action.playerId === pId) {
       st.currentPlayerIndex = (st.currentPlayerIndex - 1 + st.playerOrder.length) % st.playerOrder.length;
       st.players[pId].cardState = st.players[pId].cardState || {};
       st.players[pId].cardState.freezeTimeExtraTurn = true;
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
