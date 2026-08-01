import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export const SleepWalker: CardImplementation = {
  id: 'sleep_walker',
  name: 'Sleep Walker',
  cost: 3,
  type: 'Keep',
  description: 'Spend 3⚡ to gain 1⭐.',
  verified: false,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'START_TURN' && action.playerId === pId && st.players[pId].energy >= 3) {
       if (action.payload?._sleepWalkerDone) return st;
       
       const index = st.pendingActions.findIndex(a => a === action);
       if (index !== -1) {
          st.pendingActions.splice(index, 1);
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
    }
    
    if (action.type === 'RESPONSE_SLEEP_WALKER' && action.playerId === pId) {
       if (st.players[pId].energy >= 3) {
          st.players[pId].energy -= 3;
          st.pendingActions.unshift({ type: 'VP', playerId: pId, payload: { amount: 1 } });
          addLog(st, action, `🚶 ${st.players[pId].name} spent 3⚡ to gain 1⭐ using Sleep Walker`);
          
          // Allow them to do it again if they still have energy! So we unshift START_TURN again without _sleepWalkerDone
          const nextAction = { ...action.payload.originalAction };
          delete nextAction.skipPreEvent;
          st.pendingActions.push(nextAction); // put it back after VP
       } else {
          // just continue
          const nextAction = { ...action.payload.originalAction, payload: { ...action.payload.originalAction.payload, _sleepWalkerDone: true } };
          delete nextAction.skipPreEvent;
          st.pendingActions.unshift(nextAction);
       }
    }
    
    if (action.type === 'RESPONSE_SLEEP_WALKER_NO' && action.playerId === pId) {
       const nextAction = { ...action.payload.originalAction, payload: { ...action.payload.originalAction.payload, _sleepWalkerDone: true } };
       delete nextAction.skipPreEvent;
       st.pendingActions.unshift(nextAction);
    }
    
    return st;
  }
};
