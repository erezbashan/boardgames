import { KotState, PendingAction } from '../types';
import { CardImplementation } from './types';
import { addLog } from '../utils';

export const ItHasAChild: CardImplementation = {
  id: 'it_has_a_child',
  name: 'It Has a Child',
  cost: 7,
  type: 'Keep',
  description: 'If you are eliminated discard all your cards and lose all your ⭐, Heal to 10❤️ and start again.',
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'DEAD' && action.playerId === pId) {
      addLog(st, action, `🌟 ${st.players[pId].name} used It Has a Child! They are reborn!`);
      
      // Heal to 10
      st.players[pId].health = st.settings.maxHealth;
      
      // Lose all stars
      st.players[pId].vp = 0;
      
      // Discard all cards
      st.players[pId].cards = [];
      
      // Cancel the DEAD action
      st.pendingActions.shift();
    }
    return st;
  }
};
