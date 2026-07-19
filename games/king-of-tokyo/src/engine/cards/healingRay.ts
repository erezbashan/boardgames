import { KotCard } from './types';

export const healingRay: KotCard = {
  id: 'healing_ray',
  name: 'Healing Ray',
  cost: 4,
  type: 'Keep',
  description: 'You can heal other monsters with your ❤️ results. They must pay you 2⚡ for each damage you heal (or their remaining ⚡ if they haven\'t got enough).',
  onEvent: (event, payload, state) => {
    if (event === 'BEFORE_RESOLVE_DICE') {
      const player = state.players[payload.playerId];
      if (player && !state.turnContext.healingRayResolved) {
        const hearts = state.dice.filter(d => d.value === 'Heart').length;
        if (hearts > 0) {
          // Find other players who can be healed
          const otherPlayers = Object.values(state.players).filter(p => p.id !== player.id && p.health < (state.settings?.maxHealth || 10) && p.health > 0);
          if (otherPlayers.length > 0) {
             const options = otherPlayers.map(p => ({
                label: `Heal ${p.name} for 2⚡`,
                action: { type: 'USE_HEALING_RAY', payload: { playerId: player.id, targetId: p.id } } as any
             }));
             options.push({ label: 'Skip', action: { type: 'USE_HEALING_RAY', payload: { playerId: player.id, skip: true } } as any });

             return {
               ...state,
               prompt: {
                 playerId: player.id,
                 text: `Use Healing Ray? (You have ${hearts} ❤️)`,
                 options
               }
             };
          }
        }
      }
    }
  }
};
