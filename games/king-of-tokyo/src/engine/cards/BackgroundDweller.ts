import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const BackgroundDweller: CardImplementation = {
  id: 'background_dweller',
  name: 'Background Dweller',
  cost: 4,
  type: 'Keep',
  description: 'You can always reroll any [3] you have.',
  verified: false,
  // Not easily implemented with standard rules because extra rerolls are generic in the engine. 
  // We can hook into ROLL to not consume roll counts if they only roll 3s? Or give a special action.
  // We'll give a special extra roll action for '3's.
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'START_TURN' && action.playerId === pId) {
      st.players[pId].cardState = st.players[pId].cardState || {};
      st.players[pId].cardState.backgroundDwellerActive = true;
    }
    return st;
  }
};
