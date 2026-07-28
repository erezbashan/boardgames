import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const RootingForTheUnderdog: CardImplementation = {
  id: 'rooting_for_the_underdog',
  name: 'Rooting for the Underdog',
  cost: 3,
  type: 'Keep',
  description: 'At the end of your turn, if you have the fewest ⭐, gain 1⭐.',
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'END_TURN' && action.playerId === pId) {
      const myVp = st.players[pId].vp;
      const otherVps = Object.values(st.players).filter(p => p.id !== pId && p.health > 0).map(p => p.vp);
      const isFewest = otherVps.length > 0 && otherVps.every(vp => myVp < vp);
      
      if (isFewest) {
        st.pendingActions.unshift({ type: 'VP', payload: { amount: 1 }, playerId: pId });
      }
    }
    return st;
  }
};
