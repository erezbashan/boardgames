import { CardBehavior } from './types';

export const SolarPowered: CardBehavior = {
  id: 'c18',
  onTurnStart: (ctx) => {
    const p = ctx.gameState.players[ctx.playerId];
    if (p.energy === 0) {
      p.energy += 1;
      ctx.log(`☀️ ${p.name} gets 1 ⚡ from Solar Powered!`);
      ctx.highlight(ctx.playerId, 'card:c18');
    }
  }
};
