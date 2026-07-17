import { CardBehavior } from './types';

export const Heal: CardBehavior = {
  id: 'c5',
  onBuy: (context) => {
    const player = context.gameState.players[context.playerId];
    player.health = Math.min(player.maxHealth || 10, player.health + 2);
    context.log(`❤️ ${player.name} healed 2 damage!`);
    context.highlight(context.playerId, 'health');
  },

};
