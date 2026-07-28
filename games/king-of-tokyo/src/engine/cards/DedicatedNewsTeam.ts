import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const DedicatedNewsTeam: CardImplementation = {
  id: 'dedicated_news_team',
  name: 'Dedicated News Team',
  cost: 3,
  type: 'Keep',
  description: 'Gain 1⭐ whenever you buy a card.',
  onPostEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'BUY' && action.playerId === pId) {
      st.pendingActions.unshift({ type: 'VP', payload: { amount: 1 }, playerId: pId });
    }
    return st;
  }
};
