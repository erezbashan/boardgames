import { CardBehavior } from './types';

export const GiantBrain: CardBehavior = {
  id: 'c22',
  onDetermineRolls: (ctx, rollsLeft) => {
    return rollsLeft + 1;
  }
};
