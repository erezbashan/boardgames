import { CardBehavior } from './types';

export const GasRefinery: CardBehavior = {
  id: 'c35',
  onBuy: (context) => {
    const player = context.gameState.players[context.playerId];
    player.victoryPoints += 2;
    context.log(`🏭 ${player.name} gained 2 ⭐ and dealt 3 damage to everyone else!`);
    context.highlight(context.playerId, 'vp');
    for (const pId in context.gameState.players) {
      if (pId !== context.playerId) {
        context.gameState.players[pId].health = Math.max(0, context.gameState.players[pId].health - 3);
        context.highlight(pId, 'health');
      }
    }
  },

};
