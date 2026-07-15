import { CardBehavior } from './types';

export const Skyscrapers: CardBehavior = {
  id: 'c37',
  onBuy: (context) => {
    const player = context.gameState.players[context.playerId];
    player.victoryPoints += 4;
    if (player.gameStats) player.gameStats.vpFromCards = (player.gameStats.vpFromCards || 0) + 4;
    context.log(`🏙️ ${player.name} gained 4 ⭐ from Skyscrapers!`);
    context.highlight(context.playerId, 'vp');
  },

};
