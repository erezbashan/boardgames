import { KotCard } from './types';

export const Energize: KotCard = {
  id: 'energize',
  name: 'Energize',
  cost: 8,
  type: 'Discard',
  description: '+ 9 ⚡',
  onEvent: (event, payload, state) => {
    if (event === 'BUY_CARD' && payload.cardId === 'energize') {
      const player = state.players[payload.playerId];
      const hasFriend = player.cards.includes('friend_of_children');
      const energyGain = 9 + (hasFriend ? 1 : 0);
      return {
        ...state,
        players: {
          ...state.players,
          [player.id]: {
            ...player,
            energy: player.energy + energyGain
          }
        },
        logs: [...state.logs, `${player.name} instantly gained ${energyGain} ⚡ from Energize!` + (hasFriend ? ' (including 1 from Friend of Children)' : '')]
      };
    }
  }
};
