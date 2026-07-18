import { KotCard } from './types';

export const ArmorPlating: KotCard = {
  id: 'armor_plating',
  name: 'Armor Plating',
  cost: 4,
  type: 'Keep',
  description: 'Ignore damage of 1.',
  onEvent: (event, payload, state) => {
    if (event === 'BEFORE_TAKE_DAMAGE') {
      if (payload.playerId === payload.cardOwnerId) {
        if (payload.damage && payload.damage.damage === 1) {
          payload.damage.damage = 0;
          return {
            ...state,
            logs: [...state.logs, `🛡️ ${state.players[payload.playerId].name}'s Armor Plating ignored 1 damage!`]
          };
        }
      }
    }
  }
};
