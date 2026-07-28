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
       const DICE_FACES = ['1', '2', '3', 'Energy', 'Heart', 'Smash'];
       const emojiMap: Record<string, string> = { Heart: '❤️', Energy: '⚡', Smash: '💥', '1': '1️⃣', '2': '2️⃣', '3': '3️⃣' };
       const options = DICE_FACES.map(face => ({
           label: `Gain a ${emojiMap[face] || face}`, 
           action: { type: 'RESPONSE_PLOT_TWIST', playerId: pId, payload: { originalAction: action, faceToChangeTo: face } }
       }));
       options.push({ label: 'No', action: { type: 'RESPONSE_PLOT_TWIST_NO', playerId: pId, payload: { originalAction: action } as any } });
       
       st.pendingActions.unshift({
          type: 'ASK',
          playerId: pId,
          payload: {
             prompt: {
                playerId: pId,
                text: `Plot Twist: Change a die and discard?`,
                options
             }
          }
       });
       const index = st.pendingActions.findIndex(a => a === action);
       if (index > 0) st.pendingActions.splice(index, 1);
    }
    
    if (action.type === 'RESPONSE_PLOT_TWIST' && action.playerId === pId) {
       const { faceToChangeTo } = action.payload;
       const dieIndex = st.dice.findIndex(d => d.value !== faceToChangeTo);
       if (dieIndex !== -1) {
          st.dice[dieIndex].value = faceToChangeTo;
          addLog(st, action, `${st.players[pId].name} used Plot Twist to gain a ${faceToChangeTo}!`);
          st.pendingActions.unshift({ type: 'DISCARD', playerId: pId, payload: { cardId: 'plot_twist' } });
       }
       st.pendingActions.unshift(action.payload.originalAction);
    }
    
    if (action.type === 'RESPONSE_PLOT_TWIST_NO' && action.playerId === pId) {
       st.pendingActions.unshift(action.payload.originalAction);
    }
    return st;
  }
};
