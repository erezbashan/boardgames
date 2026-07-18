import type { KotCard } from './types';

export const AlienMetabolism: KotCard = {
  id: 'alien_metabolism',
  name: 'Alien Metabolism',
  cost: 3,
  type: 'Keep',
  description: "Buying cards costs you 1 less ⚡.",
  onEvent: (event, payload, state) => {
    if (event === 'BUY_CARD_EVAL') {
      const ownerId = payload.cardOwnerId;
      if (payload.playerId !== ownerId) return;

      if (typeof payload.cost === 'number') {
        payload.cost = Math.max(0, payload.cost - 1);
      }
    }
  }
};
