import { CardBehavior } from './types';

export const HighAltitudeBombing: CardBehavior = {
  id: 'c29',
  onBuy: (context) => {
    const player = context.gameState.players[context.playerId];
    context.log(`💥 High Altitude Bombing! Everyone takes 3 damage!`);
    for (const pId in context.gameState.players) {
      context.gameState.players[pId].health = Math.max(0, context.gameState.players[pId].health - 3);
      context.highlight(pId, 'health');
    }
  },

};
