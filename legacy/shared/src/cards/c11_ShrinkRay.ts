import { CardBehavior } from './types';

export const ShrinkRay: CardBehavior = {
  id: 'c11',
  onDamageDealt: (ctx, damage, targetId) => {
    const target = ctx.gameState.players[targetId];
    if (target && damage > 0) {
      target.shrinkTokens = (target.shrinkTokens || 0) + 1;
      ctx.log(`📉 ${target.name} was shrunk by Shrink Ray!`);
      ctx.highlight(ctx.playerId, 'card:c11');
    }
  }
};
