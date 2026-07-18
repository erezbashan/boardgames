import type { KotCard } from './types';

export const AcidAttack: KotCard = {
  id: 'acid_attack',
  name: 'Acid Attack',
  cost: 6,
  type: 'Keep',
  description: "Deal 1 extra damage each turn (even when you don't otherwise attack).",
  onEvent: (event, payload, state) => {
    if (event === 'BEFORE_RESOLVE_ATTACKS') {
      const ownerId = payload.cardOwnerId;
      if (payload.playerId !== ownerId) return; // Only triggers on owner's turn

      if (typeof payload.smashCount === 'number') {
        payload.smashCount += 1;
        // Optionally add a log here, but the engine will log the total smash count
        return { ...state, logs: [...state.logs, `🧪 ${state.players[ownerId].name}'s Acid Attack adds 1 💥!`] };
      }
    }
  }
};
