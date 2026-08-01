import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export const PlotTwist: CardImplementation = {
  id: 'plot_twist',
  name: 'Plot Twist',
  cost: 3,
  type: 'Keep',
  description: 'Change one die to any result. Discard when used.',
  verified: false,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'RESOLVE_ROLLS' && action.playerId === pId) {
       if (action.payload?._plotTwistDone) return st;
       
       const index = st.pendingActions.findIndex(a => a === action);
       if (index !== -1) {
          const uniqueFaces = Array.from(new Set(st.dice.map(d => d.value)));
          if (uniqueFaces.length > 0) {
             st.pendingActions.splice(index, 1);
             const emojiMap: Record<string, string> = { Heart: '❤️', Energy: '⚡', Smash: '💥', '1': '1️⃣', '2': '2️⃣', '3': '3️⃣' };
             const options = uniqueFaces.map(face => ({
                 label: `Change a ${emojiMap[face] || face}`, 
                 action: { type: 'ASK_PLOT_TWIST_TARGET', playerId: pId, payload: { originalAction: action, faceToChange: face } }
             }));
             options.push({ label: 'No', action: { type: 'RESPONSE_PLOT_TWIST_NO', playerId: pId, payload: { originalAction: action } as any } });
             
             st.pendingActions.unshift({
                type: 'ASK',
                playerId: pId,
                payload: {
                   prompt: {
                      playerId: pId,
                      text: `Plot Twist: Change a die (and discard this card)?`,
                      options
                   }
                }
             });
          }
       }
    }
    
    if (action.type === 'ASK_PLOT_TWIST_TARGET' && action.playerId === pId) {
       const emojiMap: Record<string, string> = { Heart: '❤️', Energy: '⚡', Smash: '💥', '1': '1️⃣', '2': '2️⃣', '3': '3️⃣' };
       const faces = ['1', '2', '3', 'Heart', 'Energy', 'Smash'];
       const options = faces.map(f => ({
           label: `To ${emojiMap[f]}`,
           action: { type: 'RESPONSE_PLOT_TWIST', playerId: pId, payload: { originalAction: action.payload.originalAction, faceToChange: action.payload.faceToChange, newFace: f } }
       }));
       options.push({ label: 'Cancel', action: { type: 'RESPONSE_PLOT_TWIST_NO', playerId: pId, payload: { originalAction: action.payload.originalAction } as any } });
       
       st.pendingActions.unshift({
          type: 'ASK',
          playerId: pId,
          payload: {
             prompt: {
                playerId: pId,
                text: `Change ${emojiMap[action.payload.faceToChange]} to what?`,
                options
             }
          }
       });
    }
    
    if (action.type === 'RESPONSE_PLOT_TWIST' && action.playerId === pId) {
       const { faceToChange, newFace } = action.payload;
       
       const dieIndex = st.dice.findIndex(d => d.value === faceToChange);
       if (dieIndex !== -1) {
          st.dice[dieIndex] = { ...st.dice[dieIndex], value: newFace, version: (st.dice[dieIndex].version || 0) + 1, kept: false };
          st.players[pId].cards = st.players[pId].cards.filter(c => c !== 'plot_twist');
          
          const emojiMap: Record<string, string> = { Heart: '❤️', Energy: '⚡', Smash: '💥', '1': '1️⃣', '2': '2️⃣', '3': '3️⃣' };
          addLog(st, action, `${st.players[pId].name} changed a ${emojiMap[faceToChange]} to ${emojiMap[newFace]} using Plot Twist! (Card discarded)`);
       }
       
       const nextAction = { ...action.payload.originalAction };
       delete nextAction.skipPreEvent;
       st.pendingActions.unshift(nextAction);
    }
    
    if (action.type === 'RESPONSE_PLOT_TWIST_NO' && action.playerId === pId) {
       const nextAction = { ...action.payload.originalAction, payload: { ...action.payload.originalAction.payload, _plotTwistDone: true } };
       delete nextAction.skipPreEvent;
       st.pendingActions.unshift(nextAction);
    }
    return st;
  }
};
