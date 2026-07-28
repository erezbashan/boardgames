import { KotState, PendingAction, DiceFace } from './types';
import { CARD_REGISTRY } from './cards/registry';

export const DICE_FACES: DiceFace[] = ['1', '2', '3', 'Energy', 'Heart', 'Smash'];

export function addLog(state: KotState, action: PendingAction, logStr: string): void {
  let finalStr = logStr;
  if (action.affectedByCards && action.affectedByCards.length > 0) {
    const cardNames = action.affectedByCards.map(c => {
       const card = CARD_REGISTRY[c.cardId];
       const ownerName = state.players[c.playerId]?.name || 'Unknown';
       return `${card?.name || c.cardId} (${ownerName})`;
    }).join(', ');
    finalStr += ` [due to ${cardNames}]`;
  }
  state.logs.push(finalStr);
}

export function getPlayerMaxHealth(state: KotState, playerId: string): number {
  let max = state.settings.maxHealth;
  const player = state.players[playerId];
  if (player && player.cards) {
    player.cards.forEach(cardId => {
       const card = CARD_REGISTRY[cardId];
       if (card && card.getMaxHealth) {
           const cardMax = card.getMaxHealth(state, playerId);
           if (cardMax > max) max = cardMax;
       }
    });
  }
  return max;
}
