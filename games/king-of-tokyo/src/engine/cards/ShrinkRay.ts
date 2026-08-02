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
       addLog(st, action, `📉 ${st.players[targetId].name} got a Shrink counter from ${st.players[pId].name}'s Shrink Ray!`);
    }

    // 2. Reduce dice pool based on shrink counters
    // Wait, Shrink Ray belongs to the attacker, but the victim is rolling!
    // So this logic must apply to ALL players rolling dice if they have shrink counters.
    // However, ShrinkRay is owned by pId. 
    // We can just hook into SETUP_DICE for ALL players! 
    if (action.type === 'SETUP_DICE') {
       const rollerId = action.playerId;
       if (!rollerId) return st;
       const shrinkCounters = st.players[rollerId].markers?.['shrink_marker'] || 0;
       if (shrinkCounters > 0) {
          const reduction = Math.min(shrinkCounters, st.dice.length - 1); // always leave at least 1 die? Or can they roll 0? Let's say they can roll 0.
          if (reduction > 0) {
             st.dice.splice(st.dice.length - reduction, reduction);
             addLog(st, action, `📉 ${st.players[rollerId].name} rolls ${reduction} fewer dice due to Shrink counters!`);
          }
       }
    }
    return st;
  },
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    // 3. Getting rid of shrink counters with a Heart
    // Again, this applies to ALL players, but the hook only runs if Shrink Ray is in play.
    if (action.type === 'HEALTH') {
       const rollerId = action.playerId;
       if (!rollerId) return st;
       let shrinkCounters = st.players[rollerId].markers?.['shrink_marker'] || 0;
       if (shrinkCounters > 0) {
          const hearts = action.payload.amount || 0;
          if (hearts > 0) {
             const removed = Math.min(shrinkCounters, hearts);
             st.players[rollerId].markers!['shrink_marker'] -= removed;
             
             action.payload.amount -= removed; // Reduce hearts available for normal healing
             addLog(st, action, `📉 ${st.players[rollerId].name} spent ${removed} ❤️ to remove Shrink counters!`);
          }
       }
    }
    return st;
  }
};
