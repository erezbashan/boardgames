import { DominionState } from '../engine/types';
import { PlayerAction } from '../engine/actions';
import { getRandomBotAction } from './randomBot';

export function getBotAction(state: DominionState, playerId: string): PlayerAction | null {
  const player = state.players[playerId];
  if (!player || !player.isBot) return null;

  return getRandomBotAction(state, playerId);
}
