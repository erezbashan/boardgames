import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export const ThunderStomp: CardImplementation = {
  id: 'thunder_stomp',
  name: 'Thunder Stomp',
  cost: 3,
  type: 'Keep',
  description: 'If you score 4⭐ in a turn, all players roll one less die until your next turn.',
  verified: false,
  onPostEvent: (st: KotState, action: PendingAction, pId: string) => {
    // 1. Reset at the start of your turn
    if (action.type === 'START_TURN' && action.playerId === pId) {
       st.players[pId].cardState = st.players[pId].cardState || {};
       st.players[pId].cardState.thunderStompActive = false;
       st.players[pId].cardState.vpGainedThisTurn = 0;
    }
    
    // 2. Track VP gained during your turn
    if (action.type === 'VP' && action.playerId === pId && st.turnContext?.currentPlayerId === pId) {
       st.players[pId].cardState = st.players[pId].cardState || {};
       st.players[pId].cardState.vpGainedThisTurn = (st.players[pId].cardState.vpGainedThisTurn || 0) + action.payload.amount;
       
       if (st.players[pId].cardState.vpGainedThisTurn >= 4 && !st.players[pId].cardState.thunderStompActive) {
          st.players[pId].cardState.thunderStompActive = true;
          addLog(st, action, `🌩️ ${st.players[pId].name} scored 4⭐ this turn! Thunder Stomp activates!`);
       }
    }
    
    // 3. Reduce dice for everyone else
    if (action.type === 'SETUP_DICE' && action.playerId !== pId) {
       if (st.players[pId].cardState?.thunderStompActive) {
          st.dice.pop(); // remove one die
          addLog(st, action, `🌩️ ${st.players[action.playerId].name} rolls 1 fewer die due to ${st.players[pId].name}'s Thunder Stomp!`);
       }
    }
    
    return st;
  }
};
