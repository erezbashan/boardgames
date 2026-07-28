import { KotState, PendingAction, DiceFace } from './types';
import { CARD_REGISTRY } from './cards/registry';

export const DICE_FACES: DiceFace[] = ['1', '2', '3', 'Energy', 'Heart', 'Smash'];

export function addLog(state: KotState, action: PendingAction, logStr: string): void {
  let finalStr = logStr;
  if (action.affectedByCards && action.affectedByCards.length > 0) {
    const cardNames = action.affectedByCards.map(c => {
       const card = CARD_REGISTRY[c.cardId];
       return `${card?.name || c.cardId}`;
    }).join(', ');
    finalStr += ` [${cardNames}]`;
  }
  state.logs.push(finalStr);
}

export function getPlayerMaxHealth(state: KotState, playerId: string): number {
  return state.players[playerId]?.maxHealth || state.settings.maxHealth;
}
