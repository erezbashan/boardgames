import { CardBehavior } from './types';

export const CornerStore: CardBehavior = {
  id: 'c38',
  onBuy: (context) => {
    const player = context.gameState.players[context.playerId];
    player.victoryPoints += 1;
    if (player.gameStats) player.gameStats.vpFromCards = (player.gameStats.vpFromCards || 0) + 1;
    context.log(`🏪 ${player.name} gained 1 ⭐ from Corner Store!`);
    context.highlight(context.playerId, 'vp');
  },

};
