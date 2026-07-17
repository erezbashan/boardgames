import { CardBehavior } from './types';

export const FireBreathing: CardBehavior = {
  id: 'c4',
  onAttackTargeted: (ctx, targetId, damage) => {
    const game = ctx.gameState;
    const playerIds = Object.keys(game.players).filter(id => game.players[id].health > 0 || id === ctx.playerId);
    const pIdx = playerIds.indexOf(ctx.playerId);
    if (pIdx === -1) return damage;
    
    const leftNeighborId = playerIds[(pIdx - 1 + playerIds.length) % playerIds.length];
    const rightNeighborId = playerIds[(pIdx + 1) % playerIds.length];
    
    if (targetId === leftNeighborId || targetId === rightNeighborId) {
      const player = game.players[ctx.playerId] as any;
      if (!player._fireBreathingLogged) {
        ctx.log(`🔥 ${player.name} dealt 1 extra damage to neighbors with Fire Breathing!`);
        ctx.highlight(ctx.playerId, 'card:c4');
        player._fireBreathingLogged = true;
      }
      return damage + 1;
    }
    return damage;
  },
  onAttackResolved: (ctx) => {
    const player = ctx.gameState.players[ctx.playerId] as any;
    delete player._fireBreathingLogged;
  }
};
