import { KotState, PendingAction } from '../types';
import { CardImplementation } from './types';
import { addLog } from '../utils';

export const JetFighters: CardImplementation = {
  id: 'jet_fighters',
  name: 'Jet Fighters',
  cost: 5,
  type: 'Discard',
  description: '+ 5⭐ and take 4 damage',
  onBuy: (st: KotState, action: PendingAction, pId: string) => {
    addLog(st, action, `${st.players[pId].name} used Jet Fighters!`);
    
    st.pendingActions.unshift(
      { type: 'VP', playerId: pId, payload: { amount: 5 } },
      { type: 'TAKE_DAMAGE', playerId: pId, payload: { amount: 4 } }
    );
    
    return st;
  }
};
