import { CardBehavior } from './types';

export const Jetpack: CardBehavior = {
  id: 'c12',
  onYieldTokyo: (ctx) => {
    const p = ctx.gameState.players[ctx.playerId];
    p.energy += 2;
    ctx.log(`${p.name} uses Jetpack and gains 2 Energy for yielding Tokyo!`);
    ctx.highlight(ctx.playerId, 'energy');
    ctx.highlight(ctx.playerId, 'card:c12');
  }
};
