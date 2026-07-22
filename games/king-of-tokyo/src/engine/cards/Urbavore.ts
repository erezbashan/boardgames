import { CardImplementation } from './types';

export const Urbavore: CardImplementation = {
  id: 'urbavore',
  name: 'Urbavore',
  cost: 4,
  type: 'Keep',
  description: 'Gain 1 extra ⭐ when beginning the turn in Tokyo. Deal 1 extra damage when dealing any damage from Tokyo.',
  onPreEvent: (st, action, pId) => {
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
        st.pendingActions.unshift({ type: 'VP', payload: { amount: 1, reason: 'Urbavore' }, playerId: pId });
      }
    }
    return st;
  }
};
