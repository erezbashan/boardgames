import { CardBehavior } from './types';

export const PoisonSpit: CardBehavior = {
  id: 'c9',
  onDamageDealt: (ctx, damage, targetId) => {
    const target = ctx.gameState.players[targetId];
    if (target && damage > 0) {
      target.poisonTokens = (target.poisonTokens || 0) + 1;
      ctx.log(`${target.name} was poisoned by Poison Spit!`);
      ctx.highlight(ctx.playerId, 'card:c9');
    }
  }
};
