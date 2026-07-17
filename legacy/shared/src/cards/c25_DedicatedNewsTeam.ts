import { CardBehavior } from './types';

export const DedicatedNewsTeam: CardBehavior = {
  id: 'c25',
  onBuyCard: (ctx, cost) => {
    const p = ctx.gameState.players[ctx.playerId];
    p.victoryPoints += 1;
    if (p.gameStats) p.gameStats.vpFromCards = (p.gameStats.vpFromCards || 0) + 1;
    ctx.log(`📰 ${p.name} gains 1 ⭐ from Dedicated News Team!`);
    ctx.highlight(ctx.playerId, 'card:c25');
  }
};
