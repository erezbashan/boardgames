import { CardBehavior } from './types';

export const EvacuationOrders: CardBehavior = {
  id: 'c28',
  onBuy: (context) => {
    const player = context.gameState.players[context.playerId];
    for (const pId in context.gameState.players) {
      if (pId !== context.playerId) {
        const target = context.gameState.players[pId];
        const lost = Math.min(target.victoryPoints, 5);
        if (lost > 0) {
          target.victoryPoints -= lost;
          context.highlight(pId, 'vp');
        }
      }
    }
    context.log(`🚨 ${player.name} played Evacuation Orders! All other players lose up to 5 ⭐!`);
  },

};
