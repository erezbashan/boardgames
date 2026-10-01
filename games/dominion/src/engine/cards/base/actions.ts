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

export const Militia: CardDefinition = {
  id: 'militia',
  name: 'Militia',
  types: ['ACTION', 'ATTACK'],
  cost: 4,
  description: '+2 Coins. Each other player discards down to 3 cards in hand.',
  onPlay: (state, playerId) => {
    const actions: any[] = [{ type: 'GAIN_COINS', playerId, amount: 2 }];
    
    // Each other player discards down to 3 cards
    for (const pId in state.players) {
      if (pId !== playerId && state.players[pId].hand.length > 3) {
        actions.push({
          type: 'REQUEST_INPUT',
          playerId: pId,
          inputType: 'DISCARD_FOR_MILITIA',
          payload: { amount: state.players[pId].hand.length - 3 }
        });
      }
    }
    return actions;
  }
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
    { type: 'REQUEST_INPUT', playerId, inputType: 'GAIN_CARD', payload: { maxCost: 4 } }
  ],
  botChoose: (state, { playerId }) => {
    // Bot simply finds the most expensive affordable action or treasure up to 4
    const affordable = Object.entries(state.supply)
       .filter(([id, count]) => count > 0 && getCardDef(id).cost <= 4)
       .map(([id]) => getCardDef(id));
    if (affordable.length === 0) return { cardId: '' };
    affordable.sort((a, b) => b.cost - a.cost);
    return { cardId: affordable[0].id };
  }
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

export const Witch: CardDefinition = {
  id: 'witch',
  name: 'Witch',
  types: ['ACTION', 'ATTACK'],
  cost: 5,
  description: '+2 Cards. Each other player gains a Curse.',
  onPlay: (state, playerId) => {
    const actions: any[] = [{ type: 'DRAW_CARDS', playerId, amount: 2 }];
    for (const pId in state.players) {
      if (pId !== playerId) {
        actions.push({ type: 'FORCE_GAIN_CARD', playerId: pId, cardId: 'curse' });
      }
    }
    return actions;
  }
};

export const Moneylender: CardDefinition = {
  id: 'moneylender',
  name: 'Moneylender',
  types: ['ACTION'],
  cost: 4,
  description: 'You may trash a Copper from your hand for +3 Coins.',
  onPlay: (state, playerId) => {
    const hasCopper = state.players[playerId].hand.some(c => c.cardId === 'copper');
    if (!hasCopper) return [];
    return [{ type: 'REQUEST_INPUT', playerId, inputType: 'TRASH_COPPER_FOR_MONEYLENDER' }];
  },
  botChoose: (state, { playerId }) => {
    const copper = state.players[playerId].hand.find(c => c.cardId === 'copper');
    return { trashedIds: copper ? [copper.id] : [] };
  }
};

export const Poacher: CardDefinition = {
  id: 'poacher',
  name: 'Poacher',
  types: ['ACTION'],
  cost: 4,
  description: '+1 Card, +1 Action, +1 Coin. Discard a card per empty Supply pile.',
  onPlay: (state, playerId) => {
    const actions: any[] = [
      { type: 'DRAW_CARDS', playerId, amount: 1 },
      { type: 'GAIN_ACTIONS', playerId, amount: 1 },
      { type: 'GAIN_COINS', playerId, amount: 1 }
    ];
    const emptyPiles = Object.values(state.supply).filter(count => count === 0).length;
    if (emptyPiles > 0) {
      actions.push({ type: 'REQUEST_INPUT', playerId, inputType: 'DISCARD_FOR_POACHER', payload: { amount: emptyPiles } });
    }
    return actions;
  },
  botChoose: (state, { playerId }) => {
    // Basic bot just discards random cards (usually estates/curses first if possible)
    return { discardedIds: [] }; // We will fix bot logic in a sec if we want
  }
};

export const Remodel: CardDefinition = {
  id: 'remodel',
  name: 'Remodel',
  types: ['ACTION'],
  cost: 4,
  description: 'Trash a card from your hand. Gain a card costing up to 2 more than it.',
  onPlay: (state, playerId) => {
    if (state.players[playerId].hand.length === 0) return [];
    return [{ type: 'REQUEST_INPUT', playerId, inputType: 'TRASH_FOR_REMODEL' }];
  }
};

export const Mine: CardDefinition = {
  id: 'mine',
  name: 'Mine',
  types: ['ACTION'],
  cost: 5,
  description: 'You may trash a Treasure from your hand. Gain a Treasure to your hand costing up to 3 more than it.',
  onPlay: (state, playerId) => {
    const hasTreasure = state.players[playerId].hand.some(c => getCardDef(c.cardId).types.includes('TREASURE'));
    if (!hasTreasure) return [];
    return [{ type: 'REQUEST_INPUT', playerId, inputType: 'TRASH_FOR_MINE' }];
  }
};
