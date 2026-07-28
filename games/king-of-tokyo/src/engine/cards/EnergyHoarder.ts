import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const EnergyHoarder: CardImplementation = {
  id: 'energy_hoarder',
  name: 'Energy Hoarder',
  cost: 3,
  type: 'Keep',
  description: 'At the end of your turn, gain 1⭐ for every 6⚡ you have.',
  verified: false,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'END_TURN' && action.playerId === pId) {
      const vps = Math.floor(st.players[pId].energy / 6);
      if (vps > 0) {
        st.pendingActions.unshift({ type: 'VP', payload: { amount: vps }, playerId: pId });
      }
    }
    return st;
  }
};