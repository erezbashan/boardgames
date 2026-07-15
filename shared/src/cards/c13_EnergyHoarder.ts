import { CardBehavior } from './types';

export const EnergyHoarder: CardBehavior = {
  id: 'c13',
  onBeforeGainEnergy: (ctx, energy) => {
    if (energy > 0) {
      ctx.log(`${ctx.gameState.players[ctx.playerId].name} gains 1 extra ⚡ from Energy Hoarder!`);
      ctx.highlight(ctx.playerId, 'card:c13');
      return energy + 1;
    }
    return energy;
  }
};
