import { CardBehavior } from './types';

export const NovaBreath: CardBehavior = {
  id: 'c2',
  onDetermineAttackTargets: (ctx, currentTargets) => {
    const p = ctx.gameState.players[ctx.playerId];
    const targets = Object.keys(ctx.gameState.players).filter(id => id !== ctx.playerId && ctx.gameState.players[id].health > 0);
    ctx.log(`🌊 ${p.name} uses Nova Breath to attack ALL other players!`);
    ctx.highlight(ctx.playerId, 'card:c2');
    return targets;
  }
};
