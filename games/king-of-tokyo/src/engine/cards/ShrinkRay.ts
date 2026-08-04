import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export const ShrinkRay: CardImplementation = {
  id: 'shrink_ray',
  name: 'Shrink Ray',
  cost: 6,
  type: 'Keep',
  description: 'When you deal damage to monsters give them a shrink counter. A monster rolls one less die for each shrink counter. You can get rid of a shrink counter with a ❤️ (that ❤️ doesn\'t heal a damage also).',
  verified: false,
  onPostEvent: (st: KotState, action: PendingAction, pId: string) => {
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
