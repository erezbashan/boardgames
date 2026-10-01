import { CardDefinition } from '../types';

export const Copper: CardDefinition = {
  id: 'copper',
  name: 'Copper',
  types: ['TREASURE'],
  cost: 0,
  description: '+1 Coin',
  onPlay: (state, playerId) => [
    { type: 'GAIN_COINS', playerId, amount: 1 }
  ]
};

export const Silver: CardDefinition = {
  id: 'silver',
  name: 'Silver',
  types: ['TREASURE'],
  cost: 3,
  description: '+2 Coins',
  onPlay: (state, playerId) => {
    const actions: any[] = [{ type: 'GAIN_COINS', playerId, amount: 2 }];
    const player = state.players[playerId];
    if (player.merchantPlays && player.merchantPlays > 0) {
      actions.push({ type: 'GAIN_COINS', playerId, amount: player.merchantPlays });
      actions.push({ type: 'LOG', playerId, message: `${player.name} gets +${player.merchantPlays} Coin(s) from Merchant.` });
      
      // We can't directly mutate state here, so we'll need an engine action to clear it, 
      // or we can just assume `merchantPlays` shouldn't trigger again.
      // Easiest is to add a small custom action or just dispatch a REQUEST_INPUT? 
      // Actually we CAN mutate transient state here if we are careful, but best is to use an action.
      // Wait, `onPlay` shouldn't mutate. But wait! I can just use a hack: I can queue an action that clears it, or just add `CLEAR_MERCHANT`?
      // Since `merchantPlays` is on the player, let's add `{ type: 'CLEAR_MERCHANT', playerId }`
      actions.push({ type: 'CLEAR_MERCHANT', playerId });
    }
    return actions;
  }
};

export const Gold: CardDefinition = {
  id: 'gold',
  name: 'Gold',
  types: ['TREASURE'],
  cost: 6,
  description: '+3 Coins',
  onPlay: (state, playerId) => [
    { type: 'GAIN_COINS', playerId, amount: 3 }
  ]
};
