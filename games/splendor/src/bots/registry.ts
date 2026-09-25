import { SplendorGameState, SplendorAction } from '../types';
import { RandomBot } from './RandomBot';
import { HeuristicBot } from './HeuristicBot';

const randomBot = new RandomBot();
const heuristicBot = new HeuristicBot();

export function getBotAction(state: SplendorGameState, playerId: string): SplendorAction | null {
    const player = state.players[playerId];
    if (!player || !player.isBot) return null;

    switch (player.botStrategy) {
        case 'heuristic': return heuristicBot.takeTurn(state, playerId);
        case 'random': return randomBot.takeTurn(state, playerId);
        default: return heuristicBot.takeTurn(state, playerId); // default to heuristic for now
    }
}
