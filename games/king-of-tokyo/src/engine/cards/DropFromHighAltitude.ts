import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export const DropFromHighAltitude: CardImplementation = {
  id: 'drop_from_high_altitude',
  name: 'Drop from High Altitude',
  cost: 5,
  type: 'Discard',
  description: '+ 2⭐ and take control of Tokyo. If someone is already there, they still take no damage.',
  verified: true,
  onBuy: (st: KotState, action: PendingAction, pId: string) => {
    st.pendingActions.unshift({ type: 'VP', payload: { amount: 2 }, playerId: pId });
    const tokyoOccupants = st.playerOrder.filter(id => st.players[id].location.startsWith('Tokyo'));
    
    // Unshift RESPONSE_YIELD for any occupants (they all get evicted)
    tokyoOccupants.forEach(id => {
      if (id !== pId) {
        st.pendingActions.unshift({ type: 'RESPONSE_YIELD', payload: { yield: true, attackerId: pId }, playerId: id });
      }
    });

    // If nobody was in Tokyo to yield (meaning no RESPONSE_YIELD will trigger an ENTER_TOKYO), we queue an ENTER_TOKYO manually.
    if (tokyoOccupants.length === 0 || (tokyoOccupants.length === 1 && tokyoOccupants[0] === pId)) {
      st.pendingActions.unshift({ type: 'ENTER_TOKYO', payload: {}, playerId: pId });
    }
    return st;
  },
};
