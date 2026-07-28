import { CardImplementation } from './types';
import { addLog } from '../utils';

export const SolarPowered: CardImplementation = {
  id: 'solar_powered',
  name: 'Solar Powered',
  cost: 2,
  type: 'Keep',
  description: 'At the end of your turn gain 1⚡ if you have no ⚡.',
  verified: true,
  onPreEvent: (st, action, pId) => {
    if (action.type === 'END_TURN' && action.playerId === pId) {
      if (st.players[pId].energy === 0) {
         st.pendingActions.unshift({ type: 'ENERGY', payload: { amount: 1 }, playerId: pId });
      }
    }
    return st;
  }
};
