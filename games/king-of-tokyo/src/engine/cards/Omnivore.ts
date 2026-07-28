import { CardImplementation } from './types';
import { addLog } from '../utils';

export const Omnivore: CardImplementation = {
  id: 'omnivore',
  name: 'Omnivore',
  cost: 4,
  type: 'Keep',
  description: 'Once each turn you can score 1️⃣2️⃣3️⃣ for 2⭐. You can use these dice in other combinations.',
  verified: true,
  onPostEvent: (st, action, pId) => {
    if (action.type === 'RESOLVE_ROLLS' && action.playerId === pId) {
      const outcomeMap: Record<string, number> = {};
      st.dice.forEach(d => { outcomeMap[d.value] = (outcomeMap[d.value] || 0) + 1; });
      if (outcomeMap['1'] >= 1 && outcomeMap['2'] >= 1 && outcomeMap['3'] >= 1) {
         st.pendingActions.unshift({ type: 'VP', payload: { amount: 2 }, playerId: pId });
      }
    }
    return st;
  }
};
