import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const Herbivore: CardImplementation = {
  id: 'herbivore',
  name: 'Herbivore',
  cost: 5,
  type: 'Keep',
  description: 'Gain 1⭐ on your turn if you don\'t damage anyone.',
  verified: true,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'START_TURN' && action.playerId === pId) {
      st.players[pId].cardState = st.players[pId].cardState || {};
      st.players[pId].cardState.herbivoreDamagedSomeone = false;
    }
    if (action.type === 'TAKE_DAMAGE' && action.payload.amount > 0) {
      // If someone takes damage and it's my turn, I probably damaged them.
      // A more robust check would look at ATTACK, but TAKE_DAMAGE is safer in case of cards.
      if (st.playerOrder[st.currentPlayerIndex] === pId) {
         st.players[pId].cardState = st.players[pId].cardState || {};
         st.players[pId].cardState.herbivoreDamagedSomeone = true;
      }
    }
    if (action.type === 'END_TURN' && action.playerId === pId) {
      const state = st.players[pId].cardState || {};
      if (state.herbivoreDamagedSomeone === false) {
         st.pendingActions.unshift({ type: 'VP', playerId: pId, payload: { amount: 1 }, affectedByCards: [{cardId: 'herbivore', playerId: pId}] });
      }
    }
    return st;
  }
};
