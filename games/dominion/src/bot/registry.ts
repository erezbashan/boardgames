import { DominionState } from '../engine/types';
import { PlayerAction } from '../engine/actions';
import { getStageBotAction, CHAMPION_STAGE_STRATEGY } from './stageBot';

export function getBotAction(state: DominionState, playerId: string): PlayerAction | null {
  const player = state.players[playerId];
  if (!player || !player.isBot) return null;

  const customStrat = state.settings?.botParams?.[playerId] || state.settings?.botParams;
  const strat = (customStrat && customStrat.stageStrategy) ? customStrat.stageStrategy : CHAMPION_STAGE_STRATEGY;

  return getStageBotAction(state, playerId, strat);
}
