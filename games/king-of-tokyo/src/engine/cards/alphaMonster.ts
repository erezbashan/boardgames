import type { KotCard } from './types';

export const AlphaMonster: KotCard = {
  id: 'alpha_monster',
  name: 'Alpha Monster',
  cost: 5,
  type: 'Keep',
  description: "Gain 1⭐ when you attack.",
  onEvent: (event, payload, state) => {
    if (event === 'AFTER_ATTACK') {
      const ownerId = payload.cardOwnerId;
      if (payload.playerId !== ownerId) return;
      if (!payload.damagedSomeone) return;

      let newPlayers = { ...state.players };
      newPlayers[ownerId] = { ...newPlayers[ownerId], vp: newPlayers[ownerId].vp + 1 };
      
      return { 
        ...state, 
        players: newPlayers, 
        logs: [...state.logs, `🐺 ${newPlayers[ownerId].name}'s Alpha Monster grants 1 ⭐!`] 
      };
    }
  }
};
