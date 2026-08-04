import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export const SleepWalker: CardImplementation = {
  id: 'sleep_walker',
  name: 'Sleep Walker',
  cost: 3,
  type: 'Keep',
  description: 'Spend 3⚡ to gain 1⭐.',
  verified: true,
  onPostEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'START_TURN' && action.playerId === pId && st.players[pId].energy >= 3) {
       if (action.payload?._sleepWalkerDone) return st;
       
       st.pendingActions.unshift({
          type: 'ASK',
          playerId: pId,
          payload: {
             prompt: {
                playerId: pId,
                text: `Sleep Walker: Spend 3⚡ to gain 1⭐?`,
                options: [
                   { label: 'Yes', action: { type: 'RESPONSE_SLEEP_WALKER', playerId: pId, payload: { originalAction: action } } },
                   { label: 'No', action: { type: 'RESPONSE_SLEEP_WALKER_NO', playerId: pId, payload: { originalAction: action } } }
                ]
             }
          }
       });
    }
    return st;
  },
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    
    if (action.type === 'RESPONSE_SLEEP_WALKER' && action.playerId === pId) {
       if (st.players[pId].energy >= 3) {
          st.players[pId].energy -= 3;
          addLog(st, action, `${st.players[pId].name} spent 3⚡ to gain 1⭐ using Sleep Walker`);
          st.pendingActions.unshift({ type: 'VP', playerId: pId, payload: { amount: 1 } });
       }
    }
    
    // RESPONSE_SLEEP_WALKER_NO doesn't need to do anything anymore since originalAction is already done.
    
    return st;
  }
};
