import { CardBehavior } from './types';

export const CommuterTrain: CardBehavior = {
  id: 'c41',
  onBuy: (context) => {
    const player = context.gameState.players[context.playerId];
    player.victoryPoints += 2;
    context.log(`🚆 ${player.name} gained 2 ⭐ from Commuter Train!`);
    context.highlight(context.playerId, 'vp');
  },

};
