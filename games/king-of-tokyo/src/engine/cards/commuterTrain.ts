import { KotCard } from './types';

export const CommuterTrain: KotCard = {
  id: 'commuter_train',
  name: 'Commuter Train',
  cost: 4,
  type: 'Discard',
  description: '+ 2 ⭐',
  onEvent: (event, payload, state) => {
    if (event === 'BUY_CARD') {
      if (payload.cardId === 'commuter_train') {
        const player = state.players[payload.playerId];
        return {
          ...state,
          players: {
            ...state.players,
            [player.id]: {
              ...player,
              vp: player.vp + 2
            }
          },
          logs: [...state.logs, `${player.name} instantly gained 2 ⭐ from Commuter Train!`]
        };
      }
    }
  }
};
