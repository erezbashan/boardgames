import { KotCard } from './types';

export const ApartmentBuilding: KotCard = {
  id: 'apartment_building',
  name: 'Apartment Building',
  cost: 5,
  type: 'Discard',
  description: '+ 3 ⭐',
  onEvent: (event, payload, state) => {
    if (event === 'BUY_CARD') {
      if (payload.cardId === 'apartment_building') {
        const player = state.players[payload.playerId];
        return {
          ...state,
          players: {
            ...state.players,
            [player.id]: {
              ...player,
              vp: player.vp + 3
            }
          },
          logs: [...state.logs, `${player.name} instantly gained 3 ⭐ from Apartment Building!`]
        };
      }
    }
  }
};
