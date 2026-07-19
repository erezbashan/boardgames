import { KotCard } from './types';

export const DedicatedNewsTeam: KotCard = {
  id: 'dedicated_news_team',
  name: 'Dedicated News Team',
  cost: 3,
  type: 'Keep',
  description: 'Gain 1 ⭐ whenever you buy a card.',
  onEvent: (event, payload, state) => {
    if (event === 'BUY_CARD') {
      // Apply only when the owner buys a card, and it's not THIS card being bought right now.
      if (payload.cardOwnerId === payload.playerId && payload.cardId !== 'dedicated_news_team') {
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
          logs: [...state.logs, `${player.name} gained 1 ⭐ from Dedicated News Team!`]
        };
      }
    }
  }
};
