import { CardDefinition } from '../types';
import { getCardDef } from '../index';
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

export const Workshop: CardDefinition = {
  id: 'workshop',
  name: 'Workshop',
  types: ['ACTION'],
  cost: 3,
  description: 'Gain a card costing up to 4.',
  onPlay: (state, playerId) => [
    // Simplified: gain +2 coins (approximation until full GAIN_CARD mechanic is built)
    { type: 'GAIN_COINS', playerId, amount: 2 }
  ]
};

export const ThroneRoom: CardDefinition = {
  id: 'throne_room',
  name: 'Throne Room',
  types: ['ACTION'],
  cost: 4,
  description: 'Choose an Action card in your hand. Play it twice.',
  onPlay: (state, playerId) => {
    // Only prompt if they have action cards in hand
    const hasActions = state.players[playerId].hand.some(c => getCardDef(c.cardId).types.includes('ACTION'));
    if (!hasActions) return [];

    return [{
      type: 'REQUEST_INPUT',
      playerId,
      inputType: 'PLAY_FOR_THRONE_ROOM'
    }];
  },
  botChoose: (state, { playerId }) => {
    const hand = state.players[playerId].hand;
    const actions = hand.filter(c => getCardDef(c.cardId).types.includes('ACTION'));
    if (actions.length === 0) return { instanceId: '' };
    // Play the most expensive one
    actions.sort((a, b) => getCardDef(b.cardId).cost - getCardDef(a.cardId).cost);
    return { instanceId: actions[0].id };
  }
};

export const Chapel: CardDefinition = {
  id: 'chapel',
  name: 'Chapel',
  types: ['ACTION'],
  cost: 2,
  description: 'Trash up to 4 cards from your hand.',
  onPlay: (state, playerId) => [
    {
      type: 'REQUEST_INPUT',
      playerId,
      inputType: 'TRASH_FOR_CHAPEL',
      payload: { min: 0, max: 4 }
    }
  ],
  botChoose: (state, options) => {
    // Bot trashes: curse cards first, then excess coppers (keep 4+), then estates early game
    const pId = options.playerId;
    const hand = state.players[pId].hand;
    const allCards = [...state.players[pId].deck, ...state.players[pId].discard, ...hand];
    const totalCards = allCards.length;
    const curses = hand.filter(c => c.cardId === 'curse').map(c => c.id);
    const coppers = hand.filter(c => c.cardId === 'copper').map(c => c.id);
    const estates = hand.filter(c => c.cardId === 'estate').map(c => c.id);
    const toTrash: string[] = [...curses];
    // Trash coppers if we have many (keep min 4 total across deck)
    const totalCoppers = allCards.filter(c => c.cardId === 'copper').length;
    if (totalCoppers > 4) {
      toTrash.push(...coppers.slice(0, Math.min(coppers.length, totalCoppers - 4)));
    }
    // Trash estates early game if deck is small
    if (totalCards < 15) {
      toTrash.push(...estates.slice(0, Math.min(estates.length, 1)));
    }
    return { trashedIds: toTrash.slice(0, 4) };
  }
};

export const Gardens: CardDefinition = {
  id: 'gardens',
  name: 'Gardens',
  types: ['VICTORY'],
  cost: 4,
  description: 'Worth 1 VP for every 10 cards you have (rounded down).',
  // Gardens VP is calculated dynamically in recalculateVP, not via onPlay
};
