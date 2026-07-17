import { CardBehavior } from './types';

export const WereOnlyMakingItStronger: CardBehavior = {
  id: 'c45',
  onDamageTaken: (ctx, damage) => {
    if (damage >= 2) {
      const p = ctx.gameState.players[ctx.playerId];
      p.energy += 1;
      ctx.log(`⚡ ${p.name} gained 1 energy from We're Only Making It Stronger!`);
      ctx.highlight(ctx.playerId, 'card:c45');
    }
  }
};
