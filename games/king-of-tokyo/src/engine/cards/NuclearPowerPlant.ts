import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const NuclearPowerPlant: CardImplementation = {
  id: 'nuclear_power_plant',
  name: 'Nuclear Power Plant',
  cost: 6,
  type: 'Discard',
  description: '+2⭐ and heal 3 damage.',
  onBuy: (st: KotState, action: PendingAction, pId: string) => {
    st.pendingActions.unshift(
       { type: 'HEALTH', payload: { amount: 3, sourceCard: 'nuclear_power_plant' }, playerId: pId },
       { type: 'VP', payload: { amount: 2, sourceCard: 'nuclear_power_plant' }, playerId: pId }
    );
    return st;
  }
};
