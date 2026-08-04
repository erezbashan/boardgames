import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const Urbavore: CardImplementation = {
  id: 'urbavore',
  name: 'Urbavore',
  cost: 4,
  type: 'Keep',
  description: 'Gain 1 extra ⭐ when beginning your turn in Tokyo. You can deal 1 extra damage when resolving 💥.',
  verified: true,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'ATTACK' && action.playerId === pId && action.payload.damage > 0) {
      if (st.players[pId].location.startsWith('Tokyo')) {
        action.payload.damage += 1;
        action.payload.reason = action.payload.reason ? action.payload.reason + ', Urbavore' : 'Urbavore';
      }
    }
    return st;
  },
  onPostEvent: (st, action, pId) => {
    if (action.type === 'START_TURN' && action.playerId === pId) {
      if (st.players[pId].location.startsWith('Tokyo')) {
        st.pendingActions.unshift({ type: 'VP', payload: { amount: 1 }, playerId: pId });
      }
    }
    return st;
  }
};
