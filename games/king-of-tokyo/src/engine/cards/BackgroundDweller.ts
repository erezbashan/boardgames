import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export const BackgroundDweller: CardImplementation = {
  id: 'background_dweller',
  name: 'Background Dweller',
  cost: 4,
  type: 'Keep',
  description: 'You can always reroll any 3️⃣ you have.',
  verified: true,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'RESOLVE_ROLLS' && action.playerId === pId) {
       if (action.payload?._bgDwellerDone) return st;
       
       if (st.turnContext) delete st.turnContext.rerolledDiceId;
       
       const index = st.pendingActions.findIndex(a => a === action);
       if (index !== -1) {
          const threeCount = st.dice.filter(d => d.value === '3').length;
          if (threeCount > 0) {
             st.pendingActions.splice(index, 1);
             st.pendingActions.unshift({
                type: 'ASK',
                playerId: pId,
                payload: {
                   prompt: {
                      playerId: pId,
                      text: `Background Dweller: You have ${threeCount} x 3️⃣. Reroll one?`,
                      options: [
                         { label: 'Yes', action: { type: 'RESPONSE_BG_DWELLER_YES', playerId: pId, payload: { originalAction: action } } },
                         { label: 'No', action: { type: 'RESPONSE_BG_DWELLER_NO', playerId: pId, payload: { originalAction: action } } }
                      ]
                   }
                }
             });
          }
       }
    }
    
    if (action.type === 'RESPONSE_BG_DWELLER_YES' && action.playerId === pId) {
       const threeIndex = st.dice.findIndex(d => d.value === '3');
       if (threeIndex !== -1) {
          const DICE_FACES = ['1', '2', '3', 'Energy', 'Heart', 'Smash'];
          const newValue = DICE_FACES[Math.floor(Math.random() * DICE_FACES.length)];
          st.dice[threeIndex] = {
             ...st.dice[threeIndex],
             value: newValue as any,
             version: (st.dice[threeIndex].version || 0) + 1,
             kept: false
          };
          
          let faceStr = '';
          switch(newValue) {
             case 'Heart': faceStr = '❤️'; break;
             case 'Energy': faceStr = '⚡'; break;
             case 'Smash': faceStr = '💥'; break;
             case '1': faceStr = '1️⃣'; break;
             case '2': faceStr = '2️⃣'; break;
             case '3': faceStr = '3️⃣'; break;
          }
          
          const suffix = newValue === '3' ? 'again' : 'instead';
          
          action.affectedByCards = [{ cardId: 'background_dweller', playerId: pId }];
          
          if (!st.turnContext) st.turnContext = {};
          st.turnContext.rerolledDiceId = st.dice[threeIndex].id;
          
          addLog(st, action, `${st.players[pId].name} rerolled a 3️⃣ and got ${faceStr} ${suffix}`);
       }
       const nextAction = { ...action.payload.originalAction };
       delete nextAction.skipPreEvent;
       st.pendingActions.unshift(nextAction);
    }
    if (action.type === 'RESPONSE_BG_DWELLER_NO' && action.playerId === pId) {
       if (st.turnContext) delete st.turnContext.rerolledDiceId;
       const nextAction = { ...action.payload.originalAction, payload: { ...action.payload.originalAction.payload, _bgDwellerDone: true } };
       delete nextAction.skipPreEvent;
       st.pendingActions.unshift(nextAction);
    }
    return st;
  }
};
