import { CardBehavior } from './types';

export const Evade: CardBehavior = {
  id: 'c16',
  onBeforeDamageTaken: (ctx, damage) => {
    if (damage > 0) {
      ctx.log(`${ctx.gameState.players[ctx.playerId].name} Evaded the attack!`);
      ctx.highlight(ctx.playerId, 'card:c16');
      const p = ctx.gameState.players[ctx.playerId];
      p.cards = p.cards.filter(c => c.id !== 'c16');
      return 0;
    }
    return damage;
  }
};
