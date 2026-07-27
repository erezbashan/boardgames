import { CardImplementation } from './types';
import { CARD_REGISTRY } from './registry';

export const Opportunist: CardImplementation = {
  id: 'opportunist',
  name: 'Opportunist',
  cost: 3,
  type: 'Keep',
  description: 'Whenever a new card is revealed, you have the option of buying it as soon as it is revealed.',
  onPostEvent: (st, action, pId) => {
    // When a new card is revealed in the market, ask the Opportunist owner if they want to buy it.
    if (action.type === 'CARD_REVEALED') {
      const cardId = action.payload.cardId;
      const marketIndex = action.payload.marketIndex;
      const owner = st.players[pId];
      
      const cardDef = CARD_REGISTRY[cardId];
      if (!cardDef) return st;

      const cost = cardDef.cost;

      if (owner.energy >= cost && (!owner.cards.includes(cardId) || cardId === 'mimic')) {
         // We inject CHECK_OPPORTUNIST instead of a generic ASK directly.
         // Why? If multiple players have Opportunist, onPostEvent would push an ASK for all of them instantly.
         // If Player A buys the card, Player B's ASK prompt would still trigger, showing them a "ghost prompt" for a card that's already gone.
         // By using CHECK_OPPORTUNIST, we defer the decision to show the ASK prompt until it's actually that player's turn in the queue to answer!
         st.pendingActions.unshift({ type: 'CHECK_OPPORTUNIST', playerId: pId, payload: { cardId, marketIndex, cost } });
      }
    }
    return st;
  },
  onPreEvent: (st, action, pId) => {
    if (action.type === 'CHECK_OPPORTUNIST' && action.playerId === pId) {
       const cardId = action.payload.cardId;
       const marketIndex = action.payload.marketIndex;
       const cost = action.payload.cost;
       const cardDef = CARD_REGISTRY[cardId];
       
       // Verify the card is still in the market (another Opportunist might have bought it first)
       if (st.market[marketIndex] === cardId && st.players[pId].energy >= cost && (!st.players[pId].cards.includes(cardId) || cardId === 'mimic')) {
          // If it's your turn, you don't need a prompt to buy newly revealed cards since you can buy them normally from the market.
          if (st.playerOrder[st.currentPlayerIndex] === pId) {
             action.type = 'NOP';
             return st;
          }
          
          // Mutate the CHECK_OPPORTUNIST action into a generic ASK action
          action.type = 'ASK';
          action.payload = {
             prompt: {
                playerId: pId,
                text: `Opportunist: Buy ${cardDef.name}?`,
                options: [
                   { label: `Buy for ${cost} ⚡`, action: { type: 'RESPONSE_MULTIPLE_ACTIONS', payload: { actions: [{ type: 'BUY', payload: { cardId, marketIndex, source: 'market' }, playerId: pId }] }, playerId: pId } },
                   { label: 'Decline', action: { type: 'RESPONSE_NOP', payload: {} } }
                ]
             }
          };
       } else {
          // Mutate into NOP so it does nothing
          action.type = 'NOP';
       }
    }
    return st;
  }
};
