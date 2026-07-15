import { CardBehavior } from './types';

export const CommuterTrain: CardBehavior = {
  id: 'c41',
  onBuy: (context) => {
    const player = context.gameState.players[context.playerId];
    player.victoryPoints += 2;
    if (player.gameStats) player.gameStats.vpFromCards = (player.gameStats.vpFromCards || 0) + 2;
    context.log(`🚆 ${player.name} gained 2 ⭐ from Commuter Train!`);
    context.highlight(context.playerId, 'vp');
  },

};
