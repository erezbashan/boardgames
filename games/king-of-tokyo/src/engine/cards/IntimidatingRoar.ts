import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export const IntimidatingRoar: CardImplementation = {
  id: 'intimidating_roar',
  name: 'Intimidating Roar',
  cost: 3,
  type: 'Keep',
  description: 'The monsters in Tokyo must yield if you damage them.',
  verified: true,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'ASK') {
      const prompt = action.payload?.prompt;
      if (prompt && prompt.options && prompt.options.length > 0) {
        const firstOption = prompt.options[0].action;
        if (firstOption && firstOption.type === 'RESPONSE_YIELD') {
          const attackerId = firstOption.payload?.attackerId;
          if (attackerId === pId) {
             const index = st.pendingActions.findIndex(a => a === action);
             if (index !== -1) {
                st.pendingActions.splice(index, 1);
                st.pendingActions.unshift(firstOption);
                addLog(st, action, `${st.players[prompt.playerId].name} is forced to yield Tokyo due to Intimidating Roar!`);
             }
          }
        }
      }
    }
    return st;
  }
};
