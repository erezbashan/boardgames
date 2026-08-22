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
  onPostEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'TAKE_DAMAGE' && action.payload.attackerId === pId && action.payload._actualDamageTaken > 0) {
      if (st.players[pId].location !== 'Outside') return st;
      if (st.pendingActions.length > 0 && st.pendingActions[0].type === 'ASK') {
        const askAction = st.pendingActions[0];
        const firstOption = askAction.payload?.prompt?.options?.[0]?.action;
        if (firstOption && firstOption.type === 'RESPONSE_YIELD' && firstOption.payload?.attackerId === pId) {
           st.pendingActions.shift();
           st.pendingActions.unshift(firstOption);
           addLog(st, action, `${st.players[askAction.payload.prompt.playerId].name} is forced to yield Tokyo due to Intimidating Roar!`);
        }
      }
    }
    return st;
  }
};
