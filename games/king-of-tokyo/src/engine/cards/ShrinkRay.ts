import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export const ShrinkRay: CardImplementation = {
  id: 'shrink_ray',
  name: 'Shrink Ray',
  cost: 6,
  type: 'Keep',
  description: 'When you deal damage to a monster, give them a Shrink counter. They roll 1 less die for each counter. They can spend 1❤️ to remove a counter.',
  verified: true,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    // 1. Give shrink counters on damage
    if (action.type === 'TAKE_DAMAGE' && action.payload.amount > 0 && action.payload.attackerId === pId) {
       const targetId = action.playerId;
       if (!targetId) return st;
       st.players[targetId].markers = st.players[targetId].markers || {};
       st.players[targetId].markers['shrink_marker'] = (st.players[targetId].markers['shrink_marker'] || 0) + 1;
       addLog(st, action, `${st.players[targetId].name} got a Shrink counter from ${st.players[pId].name}'s Shrink Ray!`);
    }
    return st;
  }
};
