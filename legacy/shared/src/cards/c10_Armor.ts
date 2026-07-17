import { CardBehavior } from './types';

export const Armor: CardBehavior = {
  id: 'c10',
  onBeforeDamageTaken: (ctx, damage, sourceId) => {
    if (damage > 0) {
      ctx.log(`${ctx.gameState.players[ctx.playerId].name}'s Armor blocks 1 damage!`);
      ctx.highlight(ctx.playerId, 'card:c10');
      return Math.max(0, damage - 1);
    }
    return damage;
  }
};
