import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export const HerdCuller: CardImplementation = {
  id: 'herd_culler',
  name: 'Herd Culler',
  cost: 3,
  type: 'Keep',
  description: 'You can change one of your dice to a 1️⃣ each turn.',
  verified: true,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'START_TURN' && action.playerId === pId) {
      st.players[pId].cardState = st.players[pId].cardState || {};
      st.players[pId].cardState.herdCullerUsed = false;
    }
    
    if (action.type === 'RESOLVE_ROLLS' && action.playerId === pId) {
       if (action.payload?._herdCullerDone) return st;
       
       const index = st.pendingActions.findIndex(a => a === action);
       if (index !== -1) {
          const state = st.players[pId].cardState || {};
          if (!state.herdCullerUsed) {
             const uniqueFaces = Array.from(new Set(st.dice.filter(d => d.value !== '1').map(d => d.value)));
             if (uniqueFaces.length > 0) {
                st.pendingActions.splice(index, 1);
                const emojiMap: Record<string, string> = { Heart: '❤️', Energy: '⚡', Smash: '💥', '1': '1️⃣', '2': '2️⃣', '3': '3️⃣' };
                const options = uniqueFaces.map(face => ({
                    label: `Change a ${emojiMap[face] || face}`, 
                    action: { type: 'RESPONSE_HERD_CULLER', playerId: pId, payload: { originalAction: action, faceToChange: face } }
                }));
                options.push({ label: 'No', action: { type: 'RESPONSE_HERD_CULLER_NO', playerId: pId, payload: { originalAction: action } as any } });
                
                st.pendingActions.unshift({
                   type: 'ASK',
                   playerId: pId,
                   payload: {
                      prompt: {
                         playerId: pId,
                         text: `Herd Culler: Change a die to a 1️⃣?`,
                         options
                      }
                   }
                });
             }
          }
       }
    }
    
    if (action.type === 'RESPONSE_HERD_CULLER' && action.playerId === pId) {
       const { faceToChange } = action.payload;
       const dieIndex = st.dice.findIndex(d => d.value === faceToChange);
       if (dieIndex !== -1) {
          st.dice[dieIndex].value = '1';
          st.players[pId].cardState = st.players[pId].cardState || {};
          st.players[pId].cardState!.herdCullerUsed = true;
          addLog(st, action, `${st.players[pId].name} used Herd Culler to change a die to a 1️⃣!`);
       }
       const nextAction = { ...action.payload.originalAction };
       delete nextAction.skipPreEvent;
       st.pendingActions.unshift(nextAction);
    }
    
    if (action.type === 'RESPONSE_HERD_CULLER_NO' && action.playerId === pId) {
       const nextAction = { ...action.payload.originalAction, payload: { ...action.payload.originalAction.payload, _herdCullerDone: true } };
       delete nextAction.skipPreEvent;
       st.pendingActions.unshift(nextAction);
    }
    return st;
  }
};
