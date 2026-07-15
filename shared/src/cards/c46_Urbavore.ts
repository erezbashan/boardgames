import { CardBehavior } from './types';

export const Urbavore: CardBehavior = {
  id: 'c46',
  onTurnStart: (ctx) => {
    const p = ctx.gameState.players[ctx.playerId];
    if (p.inTokyo || p.inTokyoBay) {
      p.victoryPoints = Math.min(ctx.gameState.settings?.winningVP || 20, p.victoryPoints + 1);
      ctx.log(`🏙️ ${p.name} gained 1 extra ⭐ from Urbavore!`);
      ctx.highlight(ctx.playerId, 'card:c46');
    }
  },
  onAttackOut: (ctx, baseDmg) => {
    const p = ctx.gameState.players[ctx.playerId];
    if (p.inTokyo || p.inTokyoBay) {
      ctx.log(`🏙️ ${p.name} dealt 1 extra damage from Urbavore!`);
      ctx.highlight(ctx.playerId, 'card:c46');
      return baseDmg + 1;
    }
    return baseDmg;
  }
};
