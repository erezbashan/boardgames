import { KotCard } from './types';

export const CornerStore: KotCard = {
  id: 'corner_store',
  name: 'Corner Store',
  cost: 3,
  type: 'Discard',
  description: '+ 1 ⭐',
  onEvent: (event, payload, state) => {
    if (event === 'BUY_CARD') {
      if (payload.cardId === 'corner_store') {
        const player = state.players[payload.playerId];
        return {
          ...state,
          players: {
            ...state.players,
            [player.id]: {
              ...player,
              vp: player.vp + 1
            }
          },
          logs: [...state.logs, `${player.name} instantly gained 1 ⭐ from Corner Store!`]
        };
      }
    }
  }
};
