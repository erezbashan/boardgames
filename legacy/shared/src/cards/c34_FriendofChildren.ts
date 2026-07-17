import { CardBehavior } from './types';

export const FriendofChildren: CardBehavior = {
  id: 'c34',
  onBeforeGainEnergy: (ctx, energy) => {
    if (energy > 0) {
      ctx.log(`${ctx.gameState.players[ctx.playerId].name} gains 1 extra ⚡ from Friend of Children!`);
      ctx.highlight(ctx.playerId, 'card:c34');
      return energy + 1;
    }
    return energy;
  }
};
