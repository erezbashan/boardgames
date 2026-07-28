import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const AmusementPark: CardImplementation = {
  id: 'amusement_park',
  name: 'Amusement Park',
  cost: 6,
  type: 'Discard',
  description: '+4⭐',
  verified: true,
  onBuy: (st: KotState, action: PendingAction, pId: string) => {
    st.pendingActions.unshift({ type: 'VP', payload: { amount: 4 }, playerId: pId });
    return st;
  }
};
