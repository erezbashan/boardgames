import { CardBehavior } from './types';

export const Frenzy: CardBehavior = {
  id: 'c15',
  onBuy: (context) => {
    const player = context.gameState.players[context.playerId];
    player.hasFrenzy = true;
    context.log(`⚡ ${player.name} bought Frenzy and will take an extra turn!`);
  },
};

