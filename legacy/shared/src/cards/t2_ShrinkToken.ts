import { CardBehavior } from './types';

export const ShrinkToken: CardBehavior = {
  id: 't2',
  onDetermineDiceCount: (context, diceCount) => {
    const player = context.gameState.players[context.playerId];
    return Math.max(1, diceCount - (player.shrinkTokens || 0));
  }
};
