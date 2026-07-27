import { CardImplementation, KotState, PendingAction } from './types';
import { addLog } from '../utils';

export const DropFromHighAltitude: CardImplementation = {
  id: 'drop_from_high_altitude',
  name: 'Drop from High Altitude',
  cost: 5,
  type: 'Discard',
  description: '+ 2⭐ and take control of Tokyo. If someone is already there, they still take no damage.',
  onBuy: (st: KotState, action: PendingAction, pId: string) => {
    // Give 2 VP
    st.pendingActions.unshift({ type: 'VP', payload: { amount: 2 }, playerId: pId });
    
    // Check Tokyo
    const currentOccupant = st.tokyoOccupant;
    if (currentOccupant !== pId) {
      if (currentOccupant) {
        st.pendingActions.unshift({ type: 'RESPONSE_YIELD', payload: { yield: true, attackerId: pId }, playerId: currentOccupant });
      } else {
        st.pendingActions.unshift({ type: 'ENTER_TOKYO', payload: {}, playerId: pId });
      }
    }
  },
};
