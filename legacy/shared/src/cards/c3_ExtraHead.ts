import { CardBehavior } from './types';

export const ExtraHead: CardBehavior = {
  id: 'c3',
  onDetermineDiceCount: (ctx, diceCount) => {
    ctx.log(`🐲 ${ctx.gameState.players[ctx.playerId].name} rolls 1 extra die from Extra Head!`);
    ctx.highlight(ctx.playerId, 'card:c3');
    return diceCount + 1;
  }
};
