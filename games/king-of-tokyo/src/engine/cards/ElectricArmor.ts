import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const ElectricArmor: CardImplementation = {
  id: 'electric_armor',
  name: 'Electric Armor',
  cost: 4,
  type: 'Keep',
  description: 'When you take damage, you can spend 1⚡ to reduce it by 1.',
  verified: true,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'TAKE_DAMAGE' && action.playerId === pId && action.payload.amount > 0 && st.players[pId].energy >= 1) {
      if (!action.payload._electricArmorPrompted) {
        action.payload._electricArmorPrompted = true;
        
        st.pendingActions.unshift({
          type: 'ASK',
          playerId: pId,
          payload: {
            prompt: {
              playerId: pId,
              text: `Electric Armor: Spend 1⚡ to reduce damage by 1? (Taking ${action.payload.amount})`,
              options: [
                { label: 'Yes', action: { type: 'RESPONSE_ELECTRIC_ARMOR', playerId: pId, payload: { originalAction: action } } },
                { label: 'No', action: { type: 'RESPONSE_ELECTRIC_ARMOR_NO', playerId: pId, payload: { originalAction: action } } }
              ]
            }
          }
        });
        
        const index = st.pendingActions.findIndex(a => a === action);
        if (index !== -1) st.pendingActions.splice(index, 1);
      }
    }

    if (action.type === 'RESPONSE_ELECTRIC_ARMOR' && action.playerId === pId) {
      const orig = action.payload.originalAction;
      st.pendingActions.unshift(
        { ...orig, payload: { ...orig.payload, amount: orig.payload.amount - 1 }, affectedByCards: [{cardId: 'electric_armor', playerId: pId}] }
      );
      st.pendingActions.unshift(
        { type: 'ENERGY', playerId: pId, payload: { amount: -1 }, affectedByCards: [{cardId: 'electric_armor', playerId: pId}] }
      );
    }

    if (action.type === 'RESPONSE_ELECTRIC_ARMOR_NO' && action.playerId === pId) {
      st.pendingActions.unshift({ ...action.payload.originalAction, affectedByCards: action.payload.originalAction.affectedByCards || [] });
    }
    
    return st;
  }
};