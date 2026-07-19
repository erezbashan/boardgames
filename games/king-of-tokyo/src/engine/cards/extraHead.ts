import { KotCard } from './types';

export const ExtraHead: KotCard = {
  id: 'extra_head',
  name: 'Extra Head',
  cost: 7,
  type: 'Keep',
  description: 'You get 1 extra die. This card can be bought twice.',
  // The logic for rolling extra dice is handled centrally in reducer.ts inside ROLL_DICE and advanceTurn.
  onEvent: (event, payload, state) => {
    if (event === 'BUY_CARD' && payload.cardId === 'extra_head') {
      const player = state.players[payload.playerId];
      return {
        ...state,
        dice: [...state.dice, { id: Math.random().toString(36).substring(7), value: '1', kept: false }],
        logs: [...state.logs, `${player.name} sprouted an Extra Head!`]
      };
    }
  }
};
