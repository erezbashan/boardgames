import { CardBehavior } from './types';

export const Omnivore: CardBehavior = {
  id: 'c23',
  onBeforeScoreVP: (ctx, vp) => {
    const dice = ctx.gameState.currentDice || [];
    const has1 = dice.some(d => d.face === '1');
    const has2 = dice.some(d => d.face === '2');
    const has3 = dice.some(d => d.face === '3');
    
    if (has1 && has2 && has3) {
      ctx.log(`🍖 Omnivore triggers for ${ctx.gameState.players[ctx.playerId].name}! (+2 ⭐)`);
      ctx.highlight(ctx.playerId, 'card:c23');
      return vp + 2;
    }
    return vp;
  }
};
