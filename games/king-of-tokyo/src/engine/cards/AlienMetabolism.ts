import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export const AlienMetabolism: CardImplementation = {
  id: 'alien_metabolism',
  name: 'Alien Metabolism',
  cost: 3,
  type: 'Keep',
  description: 'Buying cards costs you 1 less ⚡.',
  onPostEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'GO_TO_MARKET' && action.playerId === pId) {
       st.turnContext = st.turnContext || {};
       st.turnContext.buyDiscount = (st.turnContext.buyDiscount || 0) + 1;
       addLog(st, action, `${st.players[pId].name} gets a 1⚡ discount on cards due to Alien Metabolism.`);
    }
    return st;
  },
  onBuy: (st: KotState, action: PendingAction, pId: string) => {
    st.turnContext = st.turnContext || {};
    st.turnContext.buyDiscount = (st.turnContext.buyDiscount || 0) + 1;
    addLog(st, action, `${st.players[pId].name} gets a 1⚡ discount on cards immediately from Alien Metabolism!`);
  }
};
