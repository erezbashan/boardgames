import { CardBehavior } from './types';

export const ApartmentBuilding: CardBehavior = {
  id: 'c40',
  onBuy: (context) => {
    const player = context.gameState.players[context.playerId];
    player.victoryPoints += 3;
    context.log(`🏢 ${player.name} gained 3 ⭐ from Apartment Building!`);
    context.highlight(context.playerId, 'vp');
  },

};
