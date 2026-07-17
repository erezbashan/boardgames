import { CardBehavior } from './types';

export const AlienMetabolism: CardBehavior = {
  id: 'c21',
  onBeforeBuyCard: (ctx, cost) => {
    if (cost > 0) {
      ctx.log(`👽 ${ctx.gameState.players[ctx.playerId].name} bought a card for 1 less ⚡ due to Alien Metabolism!`);
      ctx.highlight(ctx.playerId, 'card:c21');
      return Math.max(0, cost - 1);
    }
    return cost;
  }
};
