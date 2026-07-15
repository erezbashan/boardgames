import { CardBehavior } from './types';

export const Herbivore: CardBehavior = {
  id: 'c26',
  onTurnEnd: (context) => {
    const player = context.gameState.players[context.playerId];
    if (!player.dealtDamageThisTurn) {
      player.victoryPoints = Math.min(20, player.victoryPoints + 1);
      context.log(`🌱 ${player.name} gains 1 ⭐ from Herbivore (dealt no damage)!`);
      context.highlight(context.playerId, 'vp');
      context.highlight(context.playerId, 'card:c26');
    }
  }
};
