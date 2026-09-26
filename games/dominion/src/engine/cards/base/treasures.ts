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
  onPlay: (state, playerId) => [
    { type: 'GAIN_COINS', playerId, amount: 2 }
  ]
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
