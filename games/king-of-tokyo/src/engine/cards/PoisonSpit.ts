import { CardImplementation } from './types';
import { addLog } from '../utils';

export const PoisonSpit: CardImplementation = {
  id: 'poison_spit',
  name: 'Poison Spit',
  cost: 4,
  type: 'Keep',
  description: 'When you deal damage to monsters give them a poison counter. Monsters take 1 damage for each poison counter they have at the end of their turn. You can get rid of a poison counter with a ❤️ (that ❤️ doesn\'t heal a damage also).',
  verified: true,
  onPreEvent: (st, action, pId) => {
    // Cure poison with hearts
    if (action.type === 'HEALTH' && action.payload.amount > 0 && action.playerId) {
      const targetId = action.playerId;
      const counters = st.players[targetId]?.markers?.['poison'] || 0;
      if (counters > 0) {
        const cured = Math.min(counters, action.payload.amount);
        st.players[targetId].markers!['poison'] -= cured;
        action.payload.amount -= cured;
        addLog(st, action, `${st.players[targetId].name} spent ${cured} ❤️ to cure poison!`);
      }
    }
    // Note: Take damage at end of turn is now handled by the PoisonMarker's onPostEvent hook!
    return st;
  },
  onPostEvent: (st, action, pId) => {
    // Apply poison when dealing damage
    if (action.type === 'TAKE_DAMAGE' && action.payload.attackerId === pId && action.payload.amount > 0) {
      const targetId = action.playerId!;
      if (st.players[targetId] && st.players[targetId].health > 0) {
         st.players[targetId].markers = st.players[targetId].markers || {};
         st.players[targetId].markers!['poison'] = (st.players[targetId].markers!['poison'] || 0) + 1;
         addLog(st, action, `${st.players[targetId].name} gets a Poison counter from Poison Spit!`);
      }
    }
    return st;
  }
};
