import { CardBehavior } from './types';

export const EnergyHoard: CardBehavior = {
  id: 'c6',
  onBuy: (context) => {
    const player = context.gameState.players[context.playerId];
    player.energy += 6;
    context.log(`⚡ ${player.name} gained 6 ⚡!`);
    context.highlight(context.playerId, 'energy');
  },

};
