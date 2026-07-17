import { CardBehavior } from './types';

export const FighterSquadron: CardBehavior = {
  id: 'c43',
  onBuy: (context) => {
    const player = context.gameState.players[context.playerId];
    context.log(`✈️ Fighter Squadron dealt 3 damage to all other players!`);
    for (const pId in context.gameState.players) {
      if (pId !== context.playerId) {
        context.gameState.players[pId].health = Math.max(0, context.gameState.players[pId].health - 2);
        context.highlight(pId, 'health');
      }
    }
  },

};
