import { CardBehavior } from './types';

export const EvenBigger: CardBehavior = {
  id: 'c1',
  onBuy: (context) => {
    const player = context.gameState.players[context.playerId];
    player.maxHealth = (player.maxHealth || 10) + 2;
    player.health = Math.min(player.maxHealth || 10, player.health + 2);
    context.log(`🧬 ${player.name} got Even Bigger! Max health is now ${player.maxHealth}`);
    context.highlight(context.playerId, 'card:c1');
  }
};
