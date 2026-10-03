import { CardDefinition } from '../types';
import { getCardDef } from '../index';

const getOtherPlayersInOrder = (state: any, playerId: string) => {
  const currentIdx = state.playerOrder.indexOf(playerId);
  const others: string[] = [];
  for (let i = 1; i < state.playerOrder.length; i++) {
    others.push(state.playerOrder[(currentIdx + i) % state.playerOrder.length]);
  }
  return others;
};

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
    for (const pId of getOtherPlayersInOrder(state, playerId)) {
      if (pId !== playerId) {
        actions.push({ type: 'MILITIA_ATTACK', playerId: pId });
      }
    }
    return actions;
  }
};

export const Harbinger: CardDefinition = {
  id: 'harbinger',
  name: 'Harbinger',
  types: ['ACTION'],
  cost: 3,
  description: '+1 Card, +1 Action. Look through your discard pile. You may put a card from it onto your deck.',
  onPlay: (state, playerId) => {
    const actions: any[] = [
      { type: 'DRAW_CARDS', playerId, amount: 1 },
      { type: 'GAIN_ACTIONS', playerId, amount: 1 }
    ];
    actions.push({ type: 'REQUEST_INPUT', playerId, inputType: 'DISCARD_TO_DECK' });
    return actions;
  },
  botChoose: () => ({ instanceId: null }) // Bot skips
};

export const Library: CardDefinition = {
  id: 'library',
  name: 'Library',
  types: ['ACTION'],
  cost: 5,
  description: 'Draw until you have 7 cards in hand, skipping any Action cards you choose to; set those aside, discarding them afterwards.',
  onPlay: (state, playerId) => [
    { type: 'LIBRARY_DRAW', playerId, setAside: [] }
  ],
  botChoose: () => ({ keep: true }) // bot always keeps actions
};

export const Sentry: CardDefinition = {
  id: 'sentry',
  name: 'Sentry',
  types: ['ACTION'],
  cost: 5,
  description: '+1 Card, +1 Action. Look at the top 2 cards of your deck. Trash and/or discard any number of them. Put the rest back on top in any order.',
  onPlay: (state, playerId) => [
    { type: 'DRAW_CARDS', playerId, amount: 1 },
    { type: 'GAIN_ACTIONS', playerId, amount: 1 },
    { type: 'SENTRY_EFFECT', playerId }
  ],
  botChoose: (state, options) => {
    // Basic bot logic: discard everything revealed to simplify
    const req = options as any;
    if (req.inputType === 'SENTRY_CHOICE') {
      const cards = req.payload?.cards || [];
      return { trashIds: [], discardIds: cards.map((c: any) => c.id), deckIds: [] };
    }
    return {};
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
    ...getOtherPlayersInOrder(state, playerId).map(id => ({ type: 'DRAW_CARDS', playerId: id, amount: 1 } as any))
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
    // User requested bot to not trash things with Chapel (except maybe curses)
    const pId = options.playerId;
    const hand = state.players[pId].hand;
    const curses = hand.filter(c => c.cardId === 'curse').map(c => c.id);
    return { trashedIds: curses.slice(0, 4) };
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
    for (const pId of getOtherPlayersInOrder(state, playerId)) {
      if (pId !== playerId) {
        actions.push({ type: 'WITCH_ATTACK', playerId: pId });
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
    const player = state.players[playerId];
    const copperIdx = player.hand.findIndex(c => c.cardId === 'copper');
    if (copperIdx >= 0) {
      const copper = player.hand.splice(copperIdx, 1)[0];
      state.trash.push(copper);
      player.coins += 3;
      state.logs.push(`${player.name} trashes a Copper for +3 Coins.`);
    }
    return [];
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

export const Merchant: CardDefinition = {
  id: 'merchant',
  name: 'Merchant',
  types: ['ACTION'],
  cost: 3,
  description: '+1 Card, +1 Action. The first time you play a Silver this turn, +1 Coin.',
  onPlay: (state, playerId) => [
    { type: 'DRAW_CARDS', playerId, amount: 1 },
    { type: 'GAIN_ACTIONS', playerId, amount: 1 },
    { type: 'PLAY_MERCHANT', playerId }
  ]
};

export const Artisan: CardDefinition = {
  id: 'artisan',
  name: 'Artisan',
  types: ['ACTION'],
  cost: 6,
  description: 'Gain a card to your hand costing up to $5. Put a card from your hand onto your deck.',
  onPlay: (state, playerId) => [
    { type: 'REQUEST_INPUT', playerId, inputType: 'GAIN_CARD', payload: { maxCost: 5, destination: 'hand' } },
    { type: 'REQUEST_INPUT', playerId, inputType: 'HAND_TO_DECK' }
  ],
  botChoose: (state, options) => {
    // Basic bot just picks a copper or estate to put on deck
    const hand = state.players[options.playerId].hand;
    const junk = hand.find(c => c.cardId === 'estate' || c.cardId === 'copper') || hand[0];
    return { cardId: junk ? junk.id : '' };
  }
};

export const Bandit: CardDefinition = {
  id: 'bandit',
  name: 'Bandit',
  types: ['ACTION', 'ATTACK'],
  cost: 5,
  description: 'Gain a Gold. Each other player reveals the top 2 cards of their deck, trashes a revealed Treasure other than Copper, and discards the rest.',
  onPlay: (state, playerId) => {
    const actions: any[] = [{ type: 'FORCE_GAIN_CARD', playerId, cardId: 'gold' }];
    for (const pId of getOtherPlayersInOrder(state, playerId)) {
      if (pId !== playerId) {
        const hasMoat = state.players[pId].hand.some(c => c.cardId === 'moat');
        if (hasMoat) {
          const moat = state.players[pId].hand.find(c => c.cardId === 'moat');
          actions.push({ type: 'REVEAL_CARD', playerId: pId, instanceId: moat!.id, message: `🛡️ [Moat] ${state.players[pId].name} reveals a Moat and is unaffected by the attack.` });
        } else {
          actions.push({ type: 'BANDIT_ATTACK', playerId: pId });
        }
      }
    }
    return actions;
  }
};

export const Bureaucrat: CardDefinition = {
  id: 'bureaucrat',
  name: 'Bureaucrat',
  types: ['ACTION', 'ATTACK'],
  cost: 4,
  description: 'Gain a Silver onto your deck. Each other player reveals a Victory card from their hand and puts it onto their deck (or reveals a hand with no Victory cards).',
  onPlay: (state, playerId) => {
    const actions: any[] = [{ type: 'FORCE_GAIN_CARD', playerId, cardId: 'silver', destination: 'deck' }];
    for (const pId of getOtherPlayersInOrder(state, playerId)) {
      if (pId !== playerId) {
        actions.push({ type: 'BUREAUCRAT_ATTACK', playerId: pId });
      }
    }
    return actions;
  },
  botChoose: (state, options) => {
    const vCards = state.players[options.playerId].hand.filter(c => getCardDef(c.cardId).types.includes('VICTORY'));
    if (vCards.length > 0) return { cardId: vCards[0].id };
    return { cardId: '' };
  }
};

export const Vassal: CardDefinition = {
  id: 'vassal',
  name: 'Vassal',
  types: ['ACTION'],
  cost: 3,
  description: '+2 Coins. Discard the top card of your deck. If it is an Action card, you may play it.',
  onPlay: (state, playerId) => [
    { type: 'GAIN_COINS', playerId, amount: 2 },
    { type: 'VASSAL_EFFECT', playerId }
  ],
  botChoose: () => ({ playCard: true })
};
