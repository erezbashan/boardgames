import { KotCard } from './types';

export const heal: KotCard = {
  id: 'heal',
  name: 'Heal',
  cost: 3,
  type: 'Discard',
  description: 'Heal 2 damage.',
  onEvent: (event, payload, state) => {
    if (event === 'BUY_CARD' && payload.cardId === 'heal') {
      const buyer = state.players[payload.playerId];
      const newHealth = Math.min(state.settings?.maxHealth || 10, buyer.health + 2);
      const healed = newHealth - buyer.health;
      return {
        ...state,
        players: {
          ...state.players,
          [buyer.id]: {
            ...buyer,
            health: newHealth,
            stats: { ...buyer.stats, healthHealed: buyer.stats.healthHealed + healed }
          }
        },
        logs: [...state.logs, `${buyer.name} healed ${healed} ❤️ from Heal!`]
      };
    }
  }
};
