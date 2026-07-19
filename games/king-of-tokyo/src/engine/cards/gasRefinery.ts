import { KotCard } from './types';
import { dispatchEvent } from '../reducer';

export const gasRefinery: KotCard = {
  id: 'gas_refinery',
  name: 'Gas Refinery',
  cost: 6,
  type: 'Discard',
  description: '+ 2 ⭐ and deal 3 💥 to all other monsters.',
  onEvent: (event, payload, state) => {
    if (event === 'BUY_CARD' && payload.cardId === 'gas_refinery') {
      const player = state.players[payload.playerId];
      let newState = {
        ...state,
        players: {
          ...state.players,
          [player.id]: {
            ...player,
            vp: player.vp + 2
          }
        },
        logs: [...state.logs, `${player.name} gained 2 ⭐ and dealt 3 💥 to all other monsters!`]
      };

      const otherPlayers = Object.values(newState.players).filter(p => p.id !== player.id && p.health > 0);
      otherPlayers.forEach(tp => {
        let dmgObj = { damage: 3 };
        newState = dispatchEvent(newState, 'BEFORE_TAKE_DAMAGE', { playerId: tp.id, attackerId: player.id, damage: dmgObj });
        const actualDmg = dmgObj.damage;
        if (actualDmg > 0) {
          newState.players[tp.id].health = Math.max(0, newState.players[tp.id].health - actualDmg);
          if (newState.players[tp.id].health === 0) {
            newState.players[player.id].stats.playersKilled += 1;
            newState.logs.push(`💀 ${tp.name} was eliminated!`);
            newState = dispatchEvent(newState, 'MONSTER_DIED', { playerId: player.id, deadPlayerId: tp.id });
          }
        }
      });

      return newState;
    }
  }
};
