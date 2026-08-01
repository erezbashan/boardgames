import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export const Stretchy: CardImplementation = {
  id: 'stretchy',
  name: 'Stretchy',
  cost: 3,
  type: 'Keep',
  description: 'You can spend 2⚡ to change one of your dice to any result.',
  verified: false,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'START_TURN' && action.playerId === pId) {
      st.players[pId].cardState = st.players[pId].cardState || {};
      st.players[pId].cardState.stretchyUsed = false;
    }
    
    if (action.type === 'RESOLVE_ROLLS' && action.playerId === pId && st.players[pId].energy >= 2) {
       if (action.payload?._stretchyDone) return st;
       
       const index = st.pendingActions.findIndex(a => a === action);
       if (index !== -1) {
          const state = st.players[pId].cardState || {};
          if (!state.stretchyUsed) {
             const uniqueFaces = Array.from(new Set(st.dice.map(d => d.value)));
             if (uniqueFaces.length > 0) {
                st.pendingActions.splice(index, 1);
                const emojiMap: Record<string, string> = { Heart: '❤️', Energy: '⚡', Smash: '💥', '1': '1️⃣', '2': '2️⃣', '3': '3️⃣' };
                const options = uniqueFaces.map(face => ({
                    label: `Change a ${emojiMap[face] || face}`, 
                    action: { type: 'ASK_STRETCHY_TARGET', playerId: pId, payload: { originalAction: action, faceToChange: face } }
                }));
                options.push({ label: 'No', action: { type: 'RESPONSE_STRETCHY_NO', playerId: pId, payload: { originalAction: action } as any } });
                
                st.pendingActions.unshift({
                   type: 'ASK',
                   playerId: pId,
                   payload: {
                      prompt: {
                         playerId: pId,
                         text: `Stretchy: Spend 2⚡ to change a die?`,
                         options
                      }
                   }
                });
             }
          }
       }
    }
    
    if (action.type === 'ASK_STRETCHY_TARGET' && action.playerId === pId) {
       const emojiMap: Record<string, string> = { Heart: '❤️', Energy: '⚡', Smash: '💥', '1': '1️⃣', '2': '2️⃣', '3': '3️⃣' };
       const faces = ['1', '2', '3', 'Heart', 'Energy', 'Smash'];
       const options = faces.map(f => ({
           label: `To ${emojiMap[f]}`,
           action: { type: 'RESPONSE_STRETCHY', playerId: pId, payload: { originalAction: action.payload.originalAction, faceToChange: action.payload.faceToChange, newFace: f } }
       }));
       options.push({ label: 'Cancel', action: { type: 'RESPONSE_STRETCHY_NO', playerId: pId, payload: { originalAction: action.payload.originalAction } as any } });
       
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
    
    if (action.type === 'RESPONSE_STRETCHY' && action.playerId === pId) {
       const { faceToChange, newFace } = action.payload;
       if (st.players[pId].energy >= 2) {
           st.players[pId].energy -= 2;
           const dieIndex = st.dice.findIndex(d => d.value === faceToChange);
           if (dieIndex !== -1) {
              st.dice[dieIndex] = { ...st.dice[dieIndex], value: newFace, version: (st.dice[dieIndex].version || 0) + 1, kept: false };
              st.players[pId].cardState = st.players[pId].cardState || {};
              st.players[pId].cardState!.stretchyUsed = true;
              
              const emojiMap: Record<string, string> = { Heart: '❤️', Energy: '⚡', Smash: '💥', '1': '1️⃣', '2': '2️⃣', '3': '3️⃣' };
              addLog(st, action, `${st.players[pId].name} spent 2⚡ to change a ${emojiMap[faceToChange]} to ${emojiMap[newFace]} using Stretchy!`);
           }
       }
       const nextAction = { ...action.payload.originalAction };
       delete nextAction.skipPreEvent;
       st.pendingActions.unshift(nextAction);
    }
    
    if (action.type === 'RESPONSE_STRETCHY_NO' && action.playerId === pId) {
       const nextAction = { ...action.payload.originalAction, payload: { ...action.payload.originalAction.payload, _stretchyDone: true } };
       delete nextAction.skipPreEvent;
       st.pendingActions.unshift(nextAction);
    }
    return st;
  }
};
