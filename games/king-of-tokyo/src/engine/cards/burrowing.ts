import { KotCard } from './types';

export const Burrowing: KotCard = {
  id: 'burrowing',
  name: 'Burrowing',
  cost: 5,
  type: 'Keep',
  description: 'Deal 1 extra damage on Tokyo. Deal 1 damage when yielding Tokyo to the monster taking it.',
  onEvent: (event, payload, state) => {
    if (event === 'BEFORE_RESOLVE_ATTACKS') {
      const player = state.players[payload.playerId];
      if (player.location === 'TokyoCity' && payload.smashCount) {
        payload.smashCount.smashCount += 1;
        if (payload.smashCount.smashCount > 1) { // They were already attacking
          return {
            ...state,
            logs: [...state.logs, `💥 ${player.name} deals 1 extra damage from Burrowing!`]
          };
        }
      }
    } else if (event === 'YIELD_TOKYO') {
      const { playerId, attackerId } = payload;
      const player = state.players[playerId];
      const attacker = state.players[attackerId];
      if (attacker.health > 0) { // Deal 1 damage to attacker
        let newHealth = Math.max(0, attacker.health - 1);
        let finalState = {
          ...state,
          players: {
            ...state.players,
            [attackerId]: {
              ...attacker,
              health: newHealth
            }
          },
          logs: [...state.logs, `💥 ${player.name} deals 1 damage to ${attacker.name} with Burrowing while yielding Tokyo!`]
        };
        if (newHealth === 0) {
          finalState.logs.push(`💀 ${attacker.name} was eliminated by Burrowing!`);
        }
        return finalState;
      }
    }
  }
};
