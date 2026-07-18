import type { KotCard } from './types';

export const AlienMetabolism: KotCard = {
  id: 'alien_metabolism',
  name: 'Alien Metabolism',
  cost: 3,
  type: 'Keep',
  description: "Buying cards costs you 1 less ⚡.",
  onEvent: (event, payload, state) => {
    if (event === 'BUY_CARD_EVAL' && payload.playerId === payload.cardOwnerId && payload.cost !== undefined && payload.cost > 0) {
      payload.cost = Math.max(0, payload.cost - 1);
      if (!payload.costModifiers) payload.costModifiers = [];
      payload.costModifiers.push('Alien Metabolism');
    }
  }
};
