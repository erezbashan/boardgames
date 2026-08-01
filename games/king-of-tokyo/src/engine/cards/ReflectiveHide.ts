import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export const ReflectiveHide: CardImplementation = {
  id: 'reflective_hide',
  name: 'Reflective Hide',
  cost: 6,
  type: 'Keep',
  description: 'If you suffer damage the monster that inflicted the damage suffers 1 as well.',
  verified: false,
  onPostEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'TAKE_DAMAGE' && action.playerId === pId && action.payload.amount > 0) {
      if (action.payload.attackerId && action.payload.attackerId !== pId) {
        addLog(st, action, `🪞 ${st.players[pId].name}'s Reflective Hide strikes back!`);
        st.pendingActions.unshift({
          type: 'TAKE_DAMAGE',
          playerId: action.payload.attackerId,
          payload: { amount: 1, source: 'reflective_hide' }
        });
      }
    }
    return st;
  }
};
