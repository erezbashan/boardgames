import { CardBehavior } from './types';

export const SpikedArmor: CardBehavior = {
  id: 'c30',
  onDamageTaken: (ctx, damage, sourceId) => {
    if (damage > 0 && sourceId) {
      const s = ctx.gameState.players[sourceId];
      if (s) {
        s.health -= 1;
        ctx.log(`🦔 ${s.name} takes 1 damage from Spiked Armor!`);
        ctx.highlight(ctx.playerId, 'card:c30');
        ctx.highlight(sourceId, 'health');
        if (s.health <= 0) {
          ctx.log(`💀 ${s.name} was killed by Spiked Armor!`);
        }
      }
    }
  }
};
