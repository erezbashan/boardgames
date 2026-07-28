import { KotState, PendingAction } from '../types';
import { CardImplementation } from './types';
import { addLog } from '../utils';

export const HighAltitudeBombing: CardImplementation = {
  id: 'high_altitude_bombing',
  name: 'High Altitude Bombing',
  cost: 4,
  type: 'Discard',
  description: 'All monsters (including you) take 3 damage.',
  verified: true,
  onBuy: (st: KotState, action: PendingAction, pId: string) => {
    addLog(st, action, `${st.players[pId].name} used High Altitude Bombing! All monsters take 3 damage.`);
    
    const dmgActions: PendingAction[] = st.playerOrder.map(id => ({
      type: 'TAKE_DAMAGE',
      playerId: id,
      payload: { amount: 3 }
    }));
    
    st.pendingActions.unshift(...dmgActions);
    return st;
  }
};
