import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export const DropFromHighAltitude: CardImplementation = {
  id: 'drop_from_high_altitude',
  name: 'Drop from High Altitude',
  cost: 5,
  type: 'Discard',
  description: '+ 2⭐ and take control of Tokyo. If someone is already there, they still take no damage.',
  onBuy: (st: KotState, action: PendingAction, pId: string) => {
    st.pendingActions.unshift({ type: 'VP', payload: { amount: 2 }, playerId: pId });
    const tokyoOccupant = st.playerOrder.find(id => st.players[id].location === 'TokyoCity');
    if (tokyoOccupant && tokyoOccupant !== pId) {
      st.pendingActions.unshift({ type: 'RESPONSE_YIELD', payload: { yield: true, attackerId: pId }, playerId: tokyoOccupant });
    } else if (!tokyoOccupant) {
      st.pendingActions.unshift({ type: 'ENTER_TOKYO', payload: {}, playerId: pId });
    }
    return st;
  },
};
