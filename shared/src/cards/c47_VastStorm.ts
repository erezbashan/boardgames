import { CardBehavior } from './types';

export const VastStorm: CardBehavior = {
  id: 'c47',
  onBuy: (context) => {
    const player = context.gameState.players[context.playerId];
    player.victoryPoints += 2;
    context.log(`🌪️ ${player.name} gained 2 ⭐ and dealt 2 damage to all other players!`);
    context.highlight(context.playerId, 'vp');
    for (const pId in context.gameState.players) {
      if (pId !== context.playerId) {
        context.gameState.players[pId].health = Math.max(0, context.gameState.players[pId].health - 2);
        context.highlight(pId, 'health');
      }
    }
  },

};
