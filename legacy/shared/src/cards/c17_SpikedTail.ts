import { CardBehavior } from './types';

export const SpikedTail: CardBehavior = {
  id: 'c17',
  onAttackOut: (context, baseDmg) => {
    const p = context.gameState.players[context.playerId];
    context.log(`🗡️ ${p.name} dealt 1 extra damage from Spiked Tail!`);
    context.highlight(context.playerId, 'card:c17');
    return baseDmg + 1;
  }
};
