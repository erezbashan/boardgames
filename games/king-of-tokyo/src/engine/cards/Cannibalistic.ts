import { CardImplementation } from './types';

export const Cannibalistic: CardImplementation = {
  id: 'cannibalistic',
  name: 'Cannibalistic',
  cost: 5,
  type: 'Keep',
  description: 'When you do damage gain 1❤️.',
  verified: true,
  onPostEvent: (st, action, pId) => {
    if (action.type === 'ATTACK' && action.playerId === pId && action.payload.damage > 0) {
      st.pendingActions.unshift({ type: 'HEALTH', payload: { amount: 1 }, playerId: pId });
    }
    return st;
  }
};
