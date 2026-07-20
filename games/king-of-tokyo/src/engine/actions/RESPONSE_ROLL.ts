import { KotState, PendingAction } from '../types';
import { DICE_FACES } from '../utils';

export function handleResponseRoll(st: KotState, action: PendingAction, pId: string) {
  if (action.payload.roll) {
    st.dice = st.dice.map(d => action.payload.keptDiceIds?.includes(d.id) ? { ...d, kept: true } : { ...d, value: DICE_FACES[Math.floor(Math.random() * DICE_FACES.length)], kept: false });
    st.rollCount -= 1;
    if (st.rollCount > 0) {
      st.pendingActions.unshift({ type: 'ASK_ROLL', playerId: pId, payload: {
         prompt: {
           playerId: pId,
           text: 'Roll Dice?',
           options: [
             { label: 'Roll', action: { type: 'RESPONSE_ROLL', payload: { roll: true } } },
             { label: 'Resolve', action: { type: 'RESPONSE_ROLL', payload: { roll: false } } }
           ]
         }
      } });
    }
  }
}
