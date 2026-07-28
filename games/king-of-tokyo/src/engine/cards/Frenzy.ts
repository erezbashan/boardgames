import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export const Frenzy: CardImplementation = {
  id: 'frenzy',
  name: 'Frenzy',
  cost: 7,
  type: 'Discard',
  description: 'When you purchase this card, take another turn immediately after this one.',
  verified: true,
  onBuy: (st: KotState, action: PendingAction, pId: string) => {
    st.players[pId].markers = st.players[pId].markers || {};
    st.players[pId].markers!.extra_turn = (st.players[pId].markers!.extra_turn || 0) + 1;
    addLog(st, action, `${st.players[pId].name} gains an extra turn after this one!`);
    return st;
  },
};
