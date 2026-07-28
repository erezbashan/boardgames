import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const AcidAttack: CardImplementation = {
  id: 'acid_attack',
  name: 'Acid Attack',
  cost: 6,
  type: 'Keep',
  description: 'Deal 1 extra damage each turn (even when you don\'t otherwise attack).',
  verified: false,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    // Inject 1 extra damage whenever ATTACK is resolved, or if no attack was made, still deal 1 damage?
    // The rules say "Deal 1 extra damage each turn". The cleanest way is to do it on END_TURN if they didn't attack?
    // Actually, "even when you don't otherwise attack" means at the end of their turn they always deal at least 1 damage.
    if (action.type === 'START_TURN' && action.playerId === pId) {
      st.players[pId].cardState = st.players[pId].cardState || {};
      st.players[pId].cardState.acidAttackUsed = false;
    }
    if (action.type === 'ATTACK' && action.playerId === pId) {
      st.pendingActions.unshift({ ...action, payload: { ...action.payload, amount: action.payload.amount + 1 }, affectedByCards: [{cardId: 'acid_attack', playerId: pId}] });
      st.players[pId].cardState = st.players[pId].cardState || {};
      st.players[pId].cardState.acidAttackUsed = true;
      const index = st.pendingActions.findIndex(a => a === action);
      if (index > 0) st.pendingActions.splice(index, 1);
    }
    if (action.type === 'END_TURN' && action.playerId === pId) {
      const state = st.players[pId].cardState || {};
      if (!state.acidAttackUsed) {
        // Did not attack this turn, so deal 1 damage now.
        st.pendingActions.unshift({
          type: 'ATTACK',
          playerId: pId,
          payload: { amount: 1 },
          affectedByCards: [{cardId: 'acid_attack', playerId: pId}]
        });
      }
    }
    return st;
  }
};
