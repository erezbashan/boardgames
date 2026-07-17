import { CardBehavior } from './types';

export const Points: CardBehavior = {
  id: 'c7',
  onBuy: (context) => {
    const player = context.gameState.players[context.playerId];
    player.victoryPoints += 2;
    if (player.gameStats) player.gameStats.vpFromCards = (player.gameStats.vpFromCards || 0) + 2;
    context.log(`⭐ ${player.name} gained 2 ⭐ from Points!`);
    context.highlight(context.playerId, 'card:c7');
  },

};
