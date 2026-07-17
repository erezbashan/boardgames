import { CardBehavior } from './types';

export const RootingForTheUnderdog: CardBehavior = {
  id: 'c44',
  onTurnEnd: (ctx) => {
    const p = ctx.gameState.players[ctx.playerId];
    const others = Object.values(ctx.gameState.players).filter(other => other.id !== ctx.playerId);
    const isLowest = others.every(other => other.victoryPoints >= p.victoryPoints);
    if (isLowest && others.length > 0) {
      p.victoryPoints += 1;
    if (p.gameStats) p.gameStats.vpFromCards = (p.gameStats.vpFromCards || 0) + 1;
      ctx.log(`📣 ${p.name} gains 1 ⭐ from Rooting for the Underdog!`);
      ctx.highlight(ctx.playerId, 'card:c44');
    }
  }
};
