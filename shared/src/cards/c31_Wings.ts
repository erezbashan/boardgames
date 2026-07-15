import { CardBehavior } from './types';

export const Wings: CardBehavior = {
  id: 'c31',
  onBeforeDamageTaken: (ctx, damage, sourceId) => {
    if (damage > 0) {
      const p = ctx.gameState.players[ctx.playerId];
      if (p.energy >= 2) {
        p.energy -= 2;
        ctx.log(`${p.name} spent 2 ⚡ to ignore damage with Wings!`);
        ctx.highlight(ctx.playerId, 'card:c31');
        return 0;
      }
    }
    return damage;
  }
};
