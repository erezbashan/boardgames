import { CardBehavior } from './types';

export const PoisonQuills: CardBehavior = {
  id: 'c24',
  onAttackOut: (ctx, baseDmg) => {
    const dice = ctx.gameState.currentDice || [];
    const count2 = dice.filter(d => d.face === '2').length;
    if (count2 >= 3) {
      const p = ctx.gameState.players[ctx.playerId];
      ctx.log(`🪡 ${p.name} dealt 2 extra damage from Poison Quills!`);
      ctx.highlight(ctx.playerId, 'card:c24');
      return baseDmg + 2;
    }
    return baseDmg;
  }
};
