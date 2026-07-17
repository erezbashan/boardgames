import { CardBehavior } from './types';

export const Energize: CardBehavior = {
  id: 'c39',
  onBuy: (context) => {
    const player = context.gameState.players[context.playerId];
    player.energy += 9;
    context.log(`⚡ ${player.name} gained 9 ⚡!`);
    context.highlight(context.playerId, 'energy');
  },

};
