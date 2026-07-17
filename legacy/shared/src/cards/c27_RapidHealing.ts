import { CardBehavior } from './types';

export const RapidHealing: CardBehavior = {
  id: 'c27',
  onTurnStart: (ctx) => {
    const p = ctx.gameState.players[ctx.playerId];
    if (p.health < (p.maxHealth || 10)) {
      p.health += 1;
      ctx.log(`🩹 ${p.name} heals 1 health from Rapid Healing!`);
      ctx.highlight(ctx.playerId, 'card:c27');
    }
  }
};
