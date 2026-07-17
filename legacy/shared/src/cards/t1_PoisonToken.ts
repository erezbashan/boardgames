import { CardBehavior } from './types';

export const PoisonToken: CardBehavior = {
  id: 't1',
  onTurnStart: (context) => {
    const player = context.gameState.players[context.playerId];
    if (player.poisonTokens > 0) {
      player.health = Math.max(0, player.health - player.poisonTokens);
      context.log(`☠️ ${player.name} took ${player.poisonTokens} damage from Poison Tokens!`);
      context.highlight(context.playerId, 'health');
    }
  }
};
