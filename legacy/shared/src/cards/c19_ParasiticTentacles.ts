import { CardBehavior } from './types';

export const ParasiticTentacles: CardBehavior = {
  id: 'c19',
  onDamageDealt: (ctx, damage) => {
    if (damage > 0) {
      const p = ctx.gameState.players[ctx.playerId];
      const healed = Math.min(p.maxHealth || 10, p.health + 1) - p.health;
      if (healed > 0) {
        p.health += healed;
        ctx.log(`🐙 ${p.name} healed 1 health from Parasitic Tentacles!`);
        ctx.highlight(ctx.playerId, 'card:c19');
      }
    }
  }
};
