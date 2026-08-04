import type { KotAction, KotState } from '../engine/types';
import { getBotAction as getRandomBotAction } from './randomBot';
import { getSmartBotAction } from './smartBot';

export function getBotAction(state: KotState, playerId: string): KotAction | null {
  const player = state.players[playerId];
  if (!player) return null;

  const strategy = player.botStrategy || 'random';

  if (strategy === 'smart') {
    return getSmartBotAction(state, playerId);
  }

  // Default to random
  return getRandomBotAction(state, playerId);
}
