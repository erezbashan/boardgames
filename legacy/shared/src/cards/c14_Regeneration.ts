import { CardBehavior } from './types';

export const Regeneration: CardBehavior = {
  id: 'c14',
  onBeforeHeal: (ctx, heal) => {
    if (heal > 0) {
      ctx.log(`💖 ${ctx.gameState.players[ctx.playerId].name} heals 1 extra health from Regeneration!`);
      ctx.highlight(ctx.playerId, 'card:c14');
      return heal + 1;
    }
    return heal;
  }
};
