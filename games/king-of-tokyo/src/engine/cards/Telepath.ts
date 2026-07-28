import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const Telepath: CardImplementation = {
  id: 'telepath',
  name: 'Telepath',
  cost: 4,
  type: 'Keep',
  description: 'You have 1 extra reroll each turn.',
  verified: false,
  // Effect logic is handled generically in utils/game loop where maxRolls is calculated
  onBuy: (st: KotState, action: PendingAction, pId: string) => {
    // maxRolls modifier handled in hook or state initialization?
    // Since EvenBigger modified state directly, let's modify maxRolls here if we add it to player state
    st.players[pId].stats = { ...st.players[pId].stats, extraRerolls: (st.players[pId].stats.extraRerolls || 0) + 1 };
    return st;
  }
};