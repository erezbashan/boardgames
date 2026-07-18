import type { BaseGameState } from './types';

/**
 * Appends a random chatter message to the actionQueue if a bot decides to speak.
 */
export function withBotChatter<TState extends BaseGameState>(
  state: TState,
  botPlayerId: string,
  chatterLines: string[]
): TState {
  const humanSpoke = state.chatMessages.some((m: any) => {
    const p = Object.values(state.players).find((player: any) => player.name === m.sender);
    return p ? !p.isBot : true;
  });
  
  if (!humanSpoke && Math.random() > 0.7 && chatterLines.length > 0) {
    const player = state.players[botPlayerId];
    if (!player) return state;

    const msg = chatterLines[Math.floor(Math.random() * chatterLines.length)];
    const newActionQueue = [
      ...(state.actionQueue || []), 
      { delayMs: 0, action: { type: 'SEND_CHAT_MESSAGE', payload: { sender: player.name, text: msg, color: player.color } } }
    ];
    
    return { ...state, actionQueue: newActionQueue };
  }
  
  return state;
}
