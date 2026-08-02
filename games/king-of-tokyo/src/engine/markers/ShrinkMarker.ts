import { MarkerImplementation } from './registry';
import { addLog } from '../utils';

import { KotState, PendingAction } from '../types';

export const ShrinkMarker: MarkerImplementation = {
  id: 'shrink_marker',
  name: 'Shrink Marker',
  icon: '📉',
  description: 'Roll one less die for each shrink counter. You can get rid of a shrink counter with a ❤️ (that ❤️ doesn\'t heal a damage also).',
  onPostEvent: (st: KotState, action: PendingAction, pId: string, count?: number) => {
    if (action.type === 'SETUP_DICE' && action.playerId === pId && count! > 0) {
       const reduction = Math.min(count!, st.dice.length - 1);
       if (reduction > 0) {
          st.dice.splice(st.dice.length - reduction, reduction);
          addLog(st, action, `📉 ${st.players[pId].name} rolls ${reduction} fewer dice due to Shrink counters!`);
       }
    }
    return st;
  },
  onPreEvent: (st: KotState, action: PendingAction, pId: string, count?: number) => {
    if (action.type === 'HEALTH' && action.playerId === pId && count! > 0) {
       const hearts = action.payload.amount || 0;
       if (hearts > 0) {
          const removed = Math.min(count!, hearts);
          st.players[pId].markers!['shrink_marker'] -= removed;
          
          action.payload.amount -= removed; // Reduce hearts available for normal healing
          addLog(st, action, `📉 ${st.players[pId].name} spent ${removed} ❤️ to remove Shrink counters!`);
       }
    }
    return st;
  }
};
