import { KotState, PendingAction } from '../engine/types';

export function getActionFromRandomBot(state: KotState, playerId: string): any {
    const topAction = state.pendingActions[0];
    if (!topAction) return null;

    if (topAction.type === 'ASK_ROLL') {
        return { type: 'RESPONSE_ROLL', payload: { roll: true, keptDiceIds: [] }, playerId };
    }
    if (topAction.type === 'ASK') {
        const options = topAction.payload.prompt.options as any[];
        return options[Math.floor(Math.random() * options.length)].action;
    }
    if (topAction.type === 'ASK_MARKET') {
        return { type: 'RESPONSE_MARKET', payload: { action: 'DONE' }, playerId };
    }
    return null;
}
export const getBotAction = getActionFromRandomBot;
