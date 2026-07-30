import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const BackgroundDweller: CardImplementation = {
  id: 'background_dweller',
  name: 'Background Dweller',
  cost: 4,
  type: 'Keep',
  description: 'You can always reroll any 3️⃣ you have.',
  verified: false,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'RESOLVE_ROLLS' && action.playerId === pId) {
       if (action.payload?._bgDwellerDone) return st;
       
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
          st.dice[threeIndex].value = DICE_FACES[Math.floor(Math.random() * DICE_FACES.length)] as any;
          addLog(st, action, `${st.players[pId].name} rerolled a 3️⃣ using Background Dweller`);
       }
       st.pendingActions.unshift(action.payload.originalAction);
    }
    if (action.type === 'RESPONSE_BG_DWELLER_NO' && action.playerId === pId) {
       const nextAction = { ...action.payload.originalAction, payload: { ...action.payload.originalAction.payload, _bgDwellerDone: true } };
       st.pendingActions.unshift(nextAction);
    }
    return st;
  }
};
