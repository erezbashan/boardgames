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
       st.players[targetId].cardState = st.players[targetId].cardState || {};
       st.players[targetId].cardState.shrinkCounters = (st.players[targetId].cardState.shrinkCounters || 0) + 1;
       addLog(st, action, `📉 ${st.players[targetId].name} got a Shrink counter from ${st.players[pId].name}'s Shrink Ray!`);
    }

    // 2. Reduce dice pool based on shrink counters
    // Wait, Shrink Ray belongs to the attacker, but the victim is rolling!
    // So this logic must apply to ALL players rolling dice if they have shrink counters.
    // However, ShrinkRay is owned by pId. 
    // We can just hook into SETUP_DICE for ALL players! 
    if (action.type === 'SETUP_DICE') {
       const rollerId = action.playerId;
       const shrinkCounters = st.players[rollerId].cardState?.shrinkCounters || 0;
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
    if (action.type === 'RESOLVE_ROLLS') {
       const rollerId = action.playerId;
       let shrinkCounters = st.players[rollerId].cardState?.shrinkCounters || 0;
       if (shrinkCounters > 0) {
          // See how many Hearts they rolled
          const hearts = st.dice.filter(d => d.value === 'Heart');
          if (hearts.length > 0) {
             const removed = Math.min(shrinkCounters, hearts.length);
             st.players[rollerId].cardState.shrinkCounters -= removed;
             
             // Convert those hearts to something else so they don't heal? 
             // Or just change them to a dummy value so RESOLVE_ROLLS ignores them
             let converted = 0;
             for (let i = 0; i < st.dice.length; i++) {
                if (st.dice[i].value === 'Heart' && converted < removed) {
                   st.dice[i] = { ...st.dice[i], value: '1' }; // change to 1? Wait, 1 could give VP!
                   // We need a dummy value that does nothing. Let's use 'Heart' but handle it by intercepting HEALTH?
                   // Actually, if we change it to an empty string, outcomeMap[''] gets incremented, which does nothing!
                   st.dice[i] = { ...st.dice[i], value: '' as any };
                   converted++;
                }
             }
             addLog(st, action, `📉 ${st.players[rollerId].name} spent ${removed} ❤️ to remove Shrink counters!`);
          }
       }
    }
    return st;
  }
};
