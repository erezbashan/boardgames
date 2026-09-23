import { KotState } from '../engine/types';
import { getBucketBotAction } from './BucketBot';
import { getExactBotAction } from './ExactBot';
import { getActionFromRandomBot } from './randomBot';

export function getBotAction(state: KotState, playerId: string): any {
    const player = state.players[playerId];
    if (!player || !player.isBot) return null;

    switch (player.botStrategy) {
        case 'bucket': return getBucketBotAction(state, playerId);
        case 'exact': return getExactBotAction(state, playerId);
        case 'random': return getActionFromRandomBot(state, playerId);
        default: return getBucketBotAction(state, playerId);
    }
}
