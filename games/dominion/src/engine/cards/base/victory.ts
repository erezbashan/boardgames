import { CardDefinition } from '../types';

export const Estate: CardDefinition = {
  id: 'estate',
  name: 'Estate',
  types: ['VICTORY'],
  cost: 2,
  description: '1 VP',
  // Victory cards usually have no onPlay in base set
};

export const Duchy: CardDefinition = {
  id: 'duchy',
  name: 'Duchy',
  types: ['VICTORY'],
  cost: 5,
  description: '3 VP',
};

export const Province: CardDefinition = {
  id: 'province',
  name: 'Province',
  types: ['VICTORY'],
  cost: 8,
  description: '6 VP',
};

export const Curse: CardDefinition = {
  id: 'curse',
  name: 'Curse',
  types: ['VICTORY'], // Treated as victory technically for end game scoring, or CURSE type
  cost: 0,
  description: '-1 VP',
};
