import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export const FireBlast: CardImplementation = {
  id: 'fire_blast',
  name: 'Fire Blast',
  cost: 3,
  type: 'Discard',
  description: 'Deal 2 damage to all other monsters.',
  verified: false,
  onBuy: (st: KotState, action: PendingAction, pId: string) => {
    st.playerOrder.forEach(id => {
       if (id !== pId && st.players[id].health > 0) {
          st.pendingActions.unshift({ type: 'TAKE_DAMAGE', playerId: id, payload: { amount: 2 }, affectedByCards: [{cardId: 'fire_blast', playerId: pId}] });
       }
    });
    return st;
  }
};
