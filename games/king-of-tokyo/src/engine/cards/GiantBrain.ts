import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export const GiantBrain: CardImplementation = {
  id: 'giant_brain',
  name: 'Giant Brain',
  cost: 5,
  type: 'Keep',
  description: 'You get 1 extra reroll.',
  verified: true,
  onPostEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'SETUP_DICE' && action.playerId === pId) {
       st.maxRolls = (st.maxRolls || 3) + 1;
       st.rollCount = st.maxRolls;
       addLog(st, action, `${st.players[pId].name} gets an extra reroll thanks to their Giant Brain!`);
    }
    return st;
  }
};
