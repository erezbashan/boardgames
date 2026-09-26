import { CardDefinition } from '../types';

export const Village: CardDefinition = {
  id: 'village',
  name: 'Village',
  types: ['ACTION'],
  cost: 3,
  description: '+1 Card, +2 Actions',
  onPlay: (state, playerId) => [
    { type: 'DRAW_CARDS', playerId, amount: 1 },
    { type: 'GAIN_ACTIONS', playerId, amount: 2 }
  ]
};

export const Smithy: CardDefinition = {
  id: 'smithy',
  name: 'Smithy',
  types: ['ACTION'],
  cost: 4,
  description: '+3 Cards',
  onPlay: (state, playerId) => [
    { type: 'DRAW_CARDS', playerId, amount: 3 }
  ]
};

export const Woodcutter: CardDefinition = {
  id: 'woodcutter',
  name: 'Woodcutter',
  types: ['ACTION'],
  cost: 3,
  description: '+1 Buy, +2 Coins',
  onPlay: (state, playerId) => [
    { type: 'GAIN_BUYS', playerId, amount: 1 },
    { type: 'GAIN_COINS', playerId, amount: 2 }
  ]
};

export const Cellar: CardDefinition = {
  id: 'cellar',
  name: 'Cellar',
  types: ['ACTION'],
  cost: 2,
  description: '+1 Action. Discard any number of cards, then draw that many.',
  onPlay: (state, playerId) => [
    { type: 'GAIN_ACTIONS', playerId, amount: 1 },
    { 
      type: 'REQUEST_INPUT', 
      playerId, 
      inputType: 'DISCARD_FOR_CELLAR',
      payload: { min: 0, max: 99 } // Any number
    }
  ],
  botChoose: (state, options) => {
    // Simple bot logic: discard all victory cards in hand
    const pId = options.playerId;
    const hand = state.players[pId].hand;
    // Just mock bot discarding nothing for now, or finding estates
    const toDiscard = hand.filter(c => ['estate', 'duchy', 'province', 'curse'].includes(c.cardId)).map(c => c.id);
    return { discardedIds: toDiscard };
  }
};

export const Market: CardDefinition = {
  id: 'market',
  name: 'Market',
  types: ['ACTION'],
  cost: 5,
  description: '+1 Card, +1 Action, +1 Buy, +1 Coin',
  onPlay: (state, playerId) => [
    { type: 'DRAW_CARDS', playerId, amount: 1 },
    { type: 'GAIN_ACTIONS', playerId, amount: 1 },
    { type: 'GAIN_BUYS', playerId, amount: 1 },
    { type: 'GAIN_COINS', playerId, amount: 1 }
  ]
};

export const Festival: CardDefinition = {
  id: 'festival',
  name: 'Festival',
  types: ['ACTION'],
  cost: 5,
  description: '+2 Actions, +1 Buy, +2 Coins',
  onPlay: (state, playerId) => [
    { type: 'GAIN_ACTIONS', playerId, amount: 2 },
    { type: 'GAIN_BUYS', playerId, amount: 1 },
    { type: 'GAIN_COINS', playerId, amount: 2 }
  ]
};

export const Laboratory: CardDefinition = {
  id: 'laboratory',
  name: 'Laboratory',
  types: ['ACTION'],
  cost: 5,
  description: '+2 Cards, +1 Action',
  onPlay: (state, playerId) => [
    { type: 'DRAW_CARDS', playerId, amount: 2 },
    { type: 'GAIN_ACTIONS', playerId, amount: 1 }
  ]
};

export const CouncilRoom: CardDefinition = {
  id: 'council_room',
  name: 'Council Room',
  types: ['ACTION'],
  cost: 5,
  description: '+4 Cards, +1 Buy. Each other player draws a card.',
  onPlay: (state, playerId) => [
    { type: 'DRAW_CARDS', playerId, amount: 4 },
    { type: 'GAIN_BUYS', playerId, amount: 1 },
    // A bit of a hack: push a draw action for every OTHER player
    ...state.playerOrder.filter(id => id !== playerId).map(id => ({ type: 'DRAW_CARDS', playerId: id, amount: 1 } as any))
  ]
};

export const Moat: CardDefinition = {
  id: 'moat',
  name: 'Moat',
  types: ['ACTION', 'REACTION'],
  cost: 2,
  description: '+2 Cards. (Reaction ignored in basic mode)',
  onPlay: (state, playerId) => [
    { type: 'DRAW_CARDS', playerId, amount: 2 }
  ]
};

export const Bazaar: CardDefinition = {
  id: 'bazaar',
  name: 'Bazaar',
  types: ['ACTION'],
  cost: 5,
  description: '+1 Card, +2 Actions, +1 Coin',
  onPlay: (state, playerId) => [
    { type: 'DRAW_CARDS', playerId, amount: 1 },
    { type: 'GAIN_ACTIONS', playerId, amount: 2 },
    { type: 'GAIN_COINS', playerId, amount: 1 }
  ]
};
