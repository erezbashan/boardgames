import { CardImplementation } from './types';
import { addLog } from '../utils';

export const PoisonQuills: CardImplementation = {
  id: 'poison_quills',
  name: 'Poison Quills',
  cost: 3,
  type: 'Keep',
  description: 'When you score 2️⃣2️⃣2️⃣ also deal 2 damage.',
  verified: true,
  onPostEvent: (st, action, pId) => {
    if (action.type === 'RESOLVE_ROLLS' && action.playerId === pId) {
      const outcomeMap: Record<string, number> = {};
      st.dice.forEach(d => { outcomeMap[d.value] = (outcomeMap[d.value] || 0) + 1; });
      if (outcomeMap['2'] >= 3) {
         st.pendingActions.unshift({ type: 'ATTACK', payload: { damage: 2, reason: 'Poison Quills' }, playerId: pId });
      }
    }
    return st;
  }
};
