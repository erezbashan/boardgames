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
    
    if (!state.turnContext) state.turnContext = {};
    // Use the first affected card for animation
    state.turnContext.animatedCard = { ...action.affectedByCards[0] };
  }
  state.logs.push(finalStr);
}

export function getPlayerMaxHealth(state: KotState, playerId: string): number {
  return state.players[playerId]?.maxHealth || state.settings.maxHealth;
}

export function isTokyoBayActive(st: KotState): boolean {
  const totalOriginalPlayers = st.playerOrder.length;
  const totalLivingPlayers = st.playerOrder.filter(id => st.players[id] && st.players[id].health > 0).length;
  return totalOriginalPlayers >= 5 && totalLivingPlayers >= 5;
}
