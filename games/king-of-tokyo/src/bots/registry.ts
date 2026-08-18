import { KotState, PendingAction } from '../engine/types';
import { getBotAction as getRandomBotAction } from './randomBot';
import { getSmartBotAction } from './smartBot';
import { getParamBotAction } from './paramBot';
import { getBotAction as getQBotAction } from './qBot';
import { getRuleBotAction } from './ruleBot';

export function getBotAction(state: KotState, playerId: string): PendingAction | null {
  const player = state.players[playerId];
  if (!player) return null;

  const strategy = player.botStrategy || 'random';

  if (strategy === 'smart') {
    return getSmartBotAction(state, playerId) as PendingAction;
  }
  
  if (strategy.startsWith('param:')) {
    return getParamBotAction(state, playerId) as PendingAction;
  }

  if (strategy.startsWith('qlearn:')) {
    return getQBotAction(state, playerId) as PendingAction;
  }

  if (strategy.startsWith('rule:')) {
    return getRuleBotAction(state, playerId) as PendingAction;
  }

  // Default to random
  return getRandomBotAction(state, playerId) as PendingAction;
}
