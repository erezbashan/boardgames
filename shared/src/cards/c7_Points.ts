import { CardBehavior } from './types';

export const Points: CardBehavior = {
  id: 'c7',
  onBuy: (context) => {
    const player = context.gameState.players[context.playerId];
    player.victoryPoints += 2;
    context.log(`⭐ ${player.name} gained 2 ⭐!`);
    context.highlight(context.playerId, 'vp');
  },

};
