import { CardBehavior } from './types';

export const NuclearPowerPlant: CardBehavior = {
  id: 'c36',
  onBuy: (context) => {
    const player = context.gameState.players[context.playerId];
    player.health = Math.min(player.maxHealth || 10, player.health + 3);
    player.victoryPoints += 2;
    if (player.gameStats) player.gameStats.vpFromCards = (player.gameStats.vpFromCards || 0) + 2;
    context.log(`☢️ ${player.name} healed 3 health and gained 2 ⭐!`);
    context.highlight(context.playerId, 'health');
    context.highlight(context.playerId, 'vp');
  },

};
