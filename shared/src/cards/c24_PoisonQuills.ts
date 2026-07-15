import { CardBehavior } from './types';

export const PoisonQuills: CardBehavior = {
  id: 'c24',
  onDamageDealt: (ctx, damage, targetId) => {
    if (damage > 0) {
      const target = ctx.gameState.players[targetId];
      if (target.energy > 0) {
        target.energy -= 1;
        ctx.log(`${target.name} loses 1 ⚡ from Poison Quills!`);
        ctx.highlight(ctx.playerId, 'card:c24');
        ctx.highlight(targetId, 'energy', 'down');
      }
    }
  }
};
