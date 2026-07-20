import type { KotAction, KotState } from '../engine/reducer';

export function getBotAction(state: KotState, playerId: string): KotAction | null {
  const player = state.players[playerId];
  if (!player) return null;

  if (state.prompt && state.prompt.playerId === playerId) {
    if (state.prompt.options && state.prompt.options.length > 0) {
      // Just pick the first option or a 'Stay' if available
      const opt = state.prompt.options.find((o: any) => o.label === 'Stay') || state.prompt.options[0];
      return opt.action;
    }
  }

  return null;
}
