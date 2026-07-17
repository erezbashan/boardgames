import type { BaseGameState, BaseAction } from './types';
import { PLAYER_COLORS } from './types';

export function createBaseGameState(): BaseGameState {
  return {
    status: 'Lobby',
    players: {},
    playerOrder: [],
    winnerId: null,
    chatMessages: []
  };
}

export const baseInitialState: BaseGameState = createBaseGameState();

export function baseReducer<T extends BaseGameState>(state: T, action: BaseAction | any): T {
  switch (action.type) {
    case 'JOIN_GAME': {
      if (state.status !== 'Lobby') return state;
      const { playerId, name, isBot } = action.payload;
      if (state.players[playerId]) return state; // Already joined
      
      const newPlayerOrder = [...state.playerOrder, playerId];
      const color = PLAYER_COLORS[newPlayerOrder.length % PLAYER_COLORS.length];
      
      return {
        ...state,
        players: {
          ...state.players,
          [playerId]: { id: playerId, name, isBot, color }
        },
        playerOrder: newPlayerOrder
      };
    }
    case 'START_GAME': {
      if (state.status !== 'Lobby' || state.playerOrder.length === 0) return state;
      return { ...state, status: 'Playing' };
    }
    case 'NEW_GAME': {
      // Keep players but reset status and chat
      return {
        ...state,
        status: 'Lobby',
        winnerId: null,
        chatMessages: []
      };
    }
    case 'SEND_CHAT_MESSAGE': {
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.payload]
      };
    }
    default:
      return state;
  }
}
