import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';
import { CARD_REGISTRY } from './registry';

export const Mimic: CardImplementation = {
  id: 'mimic',
  name: 'Mimic',
  cost: 8,
  type: 'Keep',
  description: 'Choose a card any monster has in play and put a mimic counter on it. This card counts as a duplicate of that card as if it just had been bought. Spend 1⚡ at the start of your turn to change the power you are mimicking.',
  onBuy: (st: KotState, action: PendingAction, pId: string) => {
    st.pendingActions.unshift({ type: 'MIMIC_PROMPT', playerId: pId });
    return st;
  },
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'START_TURN' && action.playerId === pId && st.players[pId].energy >= 1) {
      // Check if there are actually cards to mimic to avoid annoying the user if no cards exist
      const allCards: {cId: string, owner: string}[] = [];
      st.playerOrder.forEach(id => {
         st.players[id].cards.forEach(cId => {
            if (cId !== 'mimic') allCards.push({cId, owner: id});
         });
      });
      if (allCards.length > 0) {
         st.pendingActions.unshift({ type: 'ASK', payload: {
            prompt: {
               playerId: pId,
               text: 'Mimic: Spend 1⚡ to change the mimicked card?',
               options: [
                  { label: 'Yes (1⚡)', action: { type: 'RESPONSE_MIMIC_PROMPT_CHANGE', playerId: pId } },
                  { label: 'No', action: { type: 'NOP' } }
               ]
            }
         }});
      }
    }
    
    if (action.type === 'MIMIC_PROMPT' || action.type === 'MIMIC_PROMPT_CHANGE' || action.type === 'RESPONSE_MIMIC_PROMPT_CHANGE') {
      if (action.type === 'MIMIC_PROMPT_CHANGE' || action.type === 'RESPONSE_MIMIC_PROMPT_CHANGE') {
         if (st.players[pId].energy < 1) return st; // Should not happen
         st.players[pId].energy -= 1;
      }
      
      const allCards: {cId: string, owner: string}[] = [];
      st.playerOrder.forEach(id => {
         st.players[id].cards.forEach(cId => {
            if (cId !== 'mimic') allCards.push({cId, owner: id});
         });
      });
      
      if (allCards.length === 0) {
         addLog(st, action, `🎭 ${st.players[pId].name} has no cards to mimic!`);
         if (st.players[pId].cardState) {
            st.players[pId].cardState['mimic'] = undefined;
         }
      } else {
         const options = allCards.map(c => ({
            label: `${CARD_REGISTRY[c.cId].name} (${st.players[c.owner].name})`,
            action: { type: 'RESPONSE_MIMIC_SET', payload: { cardId: c.cId } }
         }));
         st.pendingActions.unshift({ type: 'ASK', payload: {
            prompt: {
               playerId: pId,
               text: 'Choose a card to Mimic:',
               options
            }
         }});
      }
    }
    
    if ((action.type === 'MIMIC_SET' || action.type === 'RESPONSE_MIMIC_SET') && action.playerId === pId) {
      const targetId = action.payload.cardId;
      st.players[pId].cardState = st.players[pId].cardState || {};
      st.players[pId].cardState['mimic'] = targetId;
      addLog(st, action, `🎭 ${st.players[pId].name} is now mimicking ${CARD_REGISTRY[targetId].name}!`);
      
      // Simulate onBuy of the mimicked card if it exists
      const targetCard = CARD_REGISTRY[targetId];
      if (targetCard && targetCard.onBuy) {
         targetCard.onBuy(st, action, pId);
      }
    }
    
    // Forward the onPreEvent to the mimicked card
    const mimickedId = st.players[pId].cardState?.['mimic'];
    if (mimickedId && CARD_REGISTRY[mimickedId] && CARD_REGISTRY[mimickedId].onPreEvent) {
       CARD_REGISTRY[mimickedId].onPreEvent!(st, action, pId);
    }
    
    return st;
  },
  onPostEvent: (st: KotState, action: PendingAction, pId: string) => {
    // Forward the onPostEvent to the mimicked card
    const mimickedId = st.players[pId].cardState?.['mimic'];
    if (mimickedId && CARD_REGISTRY[mimickedId] && CARD_REGISTRY[mimickedId].onPostEvent) {
       CARD_REGISTRY[mimickedId].onPostEvent!(st, action, pId);
    }
    return st;
  },
  getLabel: (st: KotState, pId: string) => {
    const mimickedId = st.players[pId].cardState?.['mimic'];
    if (mimickedId && CARD_REGISTRY[mimickedId]) {
      return CARD_REGISTRY[mimickedId].name;
    }
    return 'Empty';
  }
};
