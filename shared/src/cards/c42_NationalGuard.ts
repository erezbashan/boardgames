import { CardBehavior } from './types';

export const NationalGuard: CardBehavior = {
  id: 'c42',
  onBuy: (context) => {
    const player = context.gameState.players[context.playerId];
    player.victoryPoints += 2;
    player.health = Math.max(0, player.health - 2);
    context.log(`🛡️ ${player.name} gained 2 ⭐ but took 2 damage from National Guard!`);
    context.highlight(context.playerId, 'vp');
    context.highlight(context.playerId, 'health');
  },

};
