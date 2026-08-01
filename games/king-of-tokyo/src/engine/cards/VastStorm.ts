import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export const VastStorm: CardImplementation = {
  id: 'vast_storm',
  name: 'Vast Storm',
  cost: 6,
  type: 'Discard',
  description: '+ 2⭐. All other monsters lose 1⚡ for every 2⚡ they have.',
  verified: false,
  onBuy: (st: KotState, action: PendingAction, pId: string) => {
    st.pendingActions.unshift({ type: 'VP', payload: { amount: 2 }, playerId: pId });
    
    st.playerOrder.forEach(id => {
       if (id !== pId) {
          const energy = st.players[id].energy;
          const toLose = Math.floor(energy / 2);
          if (toLose > 0) {
             st.players[id].energy -= toLose;
             addLog(st, action, `${st.players[id].name} lost ${toLose}⚡ from Vast Storm`);
          }
       }
    });
    return st;
  }
};
