import { KotCard } from './types';

export const herdCuller: KotCard = {
  id: 'herd_culler',
  name: 'Herd Culler',
  cost: 3,
  type: 'Keep',
  description: 'You can change one of your dice to a 1️⃣ each turn.',
  onEvent: (event, payload, state) => {
    if (event === 'BEFORE_RESOLVE_DICE') {
      const player = state.players[payload.playerId];
      if (player && !state.turnContext.herdCullerResolved) {
        // Find which dice are not 1️⃣
        const otherDice = state.dice.filter(d => d.value !== '1');
        if (otherDice.length > 0) {
          // Generate a prompt for each unique die face
          const uniqueFaces = [...new Set(otherDice.map(d => d.value))];
          const options = uniqueFaces.map(face => {
             const faceLabels: Record<string, string> = { Heart: '❤️', Energy: '⚡', Smash: '💥', '2': '2️⃣', '3': '3️⃣' };
             return {
               label: `Change a [${faceLabels[face] || face}] to [1️⃣]`,
               action: { type: 'USE_HERD_CULLER', payload: { playerId: player.id, faceToChange: face } } as any
             };
          });
          options.push({ label: 'Skip', action: { type: 'USE_HERD_CULLER', payload: { playerId: player.id, skip: true } } as any });
          
          return {
            ...state,
            prompt: {
              playerId: player.id,
              text: 'Use Herd Culler?',
              options
            }
          };
        }
      }
    }
  }
};
