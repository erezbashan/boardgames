import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';
import { CARD_REGISTRY } from '../cards/registry';

export function handleBuy(st: KotState, action: PendingAction, pId: string) {
  const cardId = action.payload.cardId;
  const marketIndex = action.payload.marketIndex;
  const card = CARD_REGISTRY[cardId];
  
  if (!card) return;

  if (marketIndex >= 0 && st.market[marketIndex] !== cardId) {
     addLog(st, action, `${st.players[pId].name} tried to buy ${card.name}, but it was already taken!`);
     return;
  }

  // Deduct cost
  if (st.players[pId].energy < card.cost) return;
  st.players[pId] = {
      ...st.players[pId],
      energy: st.players[pId].energy - card.cost,
      stats: {
          ...st.players[pId].stats,
          cardsBought: (st.players[pId].stats.cardsBought || 0) + 1
      }
  };
  
  addLog(st, action, `${st.players[pId].name} bought ${card.name} for ${card.cost} ⚡`);
  
  // Replace card in market
  if (marketIndex >= 0) {
     st.market[marketIndex] = ''; // clear the slot temporarily
     st.pendingActions.unshift({ type: 'FILL_MARKET', playerId: pId, payload: { index: marketIndex } });
  } else if (action.payload.source === 'deck') {
    // If buying directly from the deck (e.g. via Made In A Lab), just remove the top card
    st.deck.shift();
  }
  
  // Apply card to player
  if (card.type === 'Keep') {
     st.players[pId].cards.push(cardId);
  }
  
  // Run onBuy hook if exists
  if (card.onBuy) {
     card.onBuy(st, action, pId);
  }
}
