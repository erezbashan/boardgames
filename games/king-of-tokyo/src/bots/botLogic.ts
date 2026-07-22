import type { KotAction, KotState } from '../engine/types';
import { CARD_REGISTRY } from '../engine/cards/registry';

export function getBotAction(state: KotState, playerId: string): KotAction | null {
  const player = state.players[playerId];
  if (!player) return null;

  const topAction = state.pendingActions[0];
  if (topAction?.type.startsWith('ASK') && topAction.payload?.prompt?.playerId === playerId) {
    const prompt = topAction.payload.prompt;

    if (topAction.type === 'ASK_MARKET') {
       const energy = player.energy;
       const availableMarketCards = state.market
          .map((cardId, index) => ({ cardId, index }))
          .filter(c => c.cardId !== null && c.cardId !== undefined && c.cardId !== '');
       
       const affordableCards = availableMarketCards.filter(c => {
          const cardDef = CARD_REGISTRY[c.cardId];
          if (!cardDef) return false;
          
          if (cardDef.type === 'Keep' && player.cards.includes(c.cardId)) return false;

          let cost = cardDef.cost;
          if (player.cards.includes('alien_metabolism') || player.cards.includes('alienMetabolism')) {
             cost = Math.max(0, cost - 1);
          }
          return energy >= cost;
       });

       // 40% chance to buy a random affordable card, if any
       if (affordableCards.length > 0 && Math.random() < 0.4) {
          const toBuy = affordableCards[Math.floor(Math.random() * affordableCards.length)];
          return { type: 'RESPONSE_MARKET', payload: { action: 'BUY', cardId: toBuy.cardId, marketIndex: toBuy.index } };
       }
       
       // Otherwise, 20% chance to sweep if we have 2+ energy
       if (energy >= 2 && Math.random() < 0.2) {
          return { type: 'RESPONSE_MARKET', payload: { action: 'SWEEP' } };
       }
       
       // Otherwise just be DONE
       return { type: 'RESPONSE_MARKET', payload: { action: 'DONE' } };
    }

    if (prompt.options && prompt.options.length > 0) {
      // Pick a random option to return its exact action (RESPONSE_ROLL, RESPONSE_MARKET, etc)
      const randomIdx = Math.floor(Math.random() * prompt.options.length);
      const opt = prompt.options[randomIdx];
      return opt.action;
    }
  }

  return null;
}
