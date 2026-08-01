import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const ApartmentBuilding: CardImplementation = {
  id: 'apartment_building',
  name: 'Apartment Building',
  cost: 5,
  type: 'Discard',
  description: '+ 3⭐',
  verified: false,
  onBuy: (st: KotState, action: PendingAction, pId: string) => {
    st.pendingActions.unshift({ type: 'VP', payload: { amount: 3 }, playerId: pId });
    return st;
  }
};
