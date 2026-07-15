import { CardBehavior } from './types';

export const AlphaMonster: CardBehavior = {
  id: 'c20',
  onAttackOut: (ctx, baseDmg) => {
    const p = ctx.gameState.players[ctx.playerId];
    p.victoryPoints = Math.min(ctx.gameState.settings?.winningVP || 20, p.victoryPoints + 1);
    if (p.gameStats) p.gameStats.vpFromOther = (p.gameStats.vpFromOther || 0) + 1;
    ctx.log(`${p.name} gained 1 ⭐ from Alpha Monster!`);
    ctx.highlight(ctx.playerId, 'vp');
    ctx.highlight(ctx.playerId, 'card:c20');
    return baseDmg;
  }
};
