import { KotCard } from './types';

export const frenzy: KotCard = {
  id: 'frenzy',
  name: 'Frenzy',
  cost: 7,
  type: 'Discard',
  description: 'When you purchase this card Take another turn immediately after this one.',
  onEvent: (event, payload, state) => {
    if (event === 'BUY_CARD' && payload.cardId === 'frenzy') {
      const player = state.players[payload.playerId];
      return {
        ...state,
        turnContext: { ...state.turnContext, frenzyTurn: true },
        logs: [...state.logs, `${player.name} went into a Frenzy!`]
      };
    }
  }
};
