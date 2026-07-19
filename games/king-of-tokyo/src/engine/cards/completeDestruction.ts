import { KotCard } from './types';

export const CompleteDestruction: KotCard = {
  id: 'complete_destruction',
  name: 'Complete Destruction',
  cost: 3,
  type: 'Keep',
  description: 'If you roll 1️⃣ 2️⃣ 3️⃣ ❤️ 💥 ⚡ gain 9 ⭐ in addition to the regular results.',
  onEvent: (event, payload, state) => {
    if (event === 'BEFORE_RESOLVE_DICE' && payload.cardOwnerId === payload.playerId) {
      if (!state.dice) return;
      const finalFaces = state.dice.map(d => d.value);
      const hasAll = ['1', '2', '3', 'Heart', 'Smash', 'Energy'].every(face => finalFaces.includes(face as any));
      if (hasAll) {
        const player = state.players[payload.playerId];
        return {
          ...state,
          players: {
            ...state.players,
            [player.id]: {
              ...player,
              vp: player.vp + 9
            }
          },
          logs: [...state.logs, `${player.name} triggered Complete Destruction and gained 9 ⭐!`]
        };
      }
    }
  }
};
