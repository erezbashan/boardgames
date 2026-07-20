import type { KotAction, KotState } from '../engine/reducer';

export function getBotAction(state: KotState, playerId: string): KotAction | null {
  const player = state.players[playerId];
  if (!player) return null;

  const topAction = state.pendingActions[0];
  if (topAction?.type.startsWith('ASK') && topAction.payload?.prompt?.playerId === playerId) {
    const prompt = topAction.payload.prompt;
    if (prompt.options && prompt.options.length > 0) {
      // Just pick the first option or a 'Stay' if available
      const opt = prompt.options.find((o: any) => o.label === 'Stay') || prompt.options[0];
      return opt.action;
    }
  }

  return null;
}
