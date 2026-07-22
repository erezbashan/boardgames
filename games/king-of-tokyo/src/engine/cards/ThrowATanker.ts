import { CardImplementation } from './types';

export const ThrowATanker: CardImplementation = {
  id: 'throw_a_tanker',
  name: 'Throw a Tanker',
  cost: 4,
  type: 'Keep',
  description: 'On a turn you deal 3 or more damage gain 2⭐.',
  onPostEvent: (st, action, pId) => {
    if (action.type === 'ATTACK' && action.playerId === pId && action.payload.damage >= 3) {
      st.pendingActions.unshift({ type: 'VP', payload: { amount: 2, reason: 'Throw a Tanker' }, playerId: pId });
    }
    return st;
  }
};
