import { CardBehavior } from './types';

export const Gourmet: CardBehavior = {
  id: 'c32',
  onBeforeScoreVP: (ctx, vp) => {
    if (vp > 0) {
      const count1s = ctx.gameState.currentDice.filter(d => d.face === '1').length;
      if (count1s >= 3) {
        ctx.log(`🍽️ ${ctx.gameState.players[ctx.playerId].name} gains 1 extra ⭐ from Gourmet!`);
        ctx.highlight(ctx.playerId, 'card:c32');
        return vp + 1;
      }
    }
    return vp;
  }
};
