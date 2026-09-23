import { BOT_NAMES } from './types';
import type { BaseGameState, BaseAction } from './types';
import { PLAYER_COLORS } from './types';

export function createBaseGameState(): BaseGameState {
  return {
    status: 'Lobby',
    players: {},
    playerOrder: [],
    winnerId: null,
    chatMessages: [],
    logs: [],
    currentPlayerIndex: 0
  };
}

export const baseInitialState: BaseGameState = createBaseGameState();

export function baseReducer<T extends BaseGameState>(state: T, action: BaseAction | any): T {
  switch (action.type) {
    case 'JOIN_GAME': {
      if (state.status !== 'Lobby') return state;
      let { playerId, name, isBot, botStrategy } = action.payload;
      const existingNames = Object.values(state.players).map((p: any) => p.name);
      if (existingNames.includes(name)) {
          if (isBot) {
              const available = BOT_NAMES.filter(n => !existingNames.includes(n));
              if (available.length > 0) {
                  name = available[Math.floor(Math.random() * available.length)];
              } else {
                  let c = 2; while (existingNames.includes(name + " " + c)) c++; name = name + " " + c;
              }
          } else {
              let c = 2; while (existingNames.includes(name + " " + c)) c++; name = name + " " + c;
          }
      }
      if (state.players[playerId]) return state; // Already joined
      
      const newPlayerOrder = [...state.playerOrder, playerId];
      const color = PLAYER_COLORS[newPlayerOrder.length % PLAYER_COLORS.length];
      
      const newPlayer: any = { id: playerId, name, isBot, color };
      if (botStrategy) newPlayer.botStrategy = botStrategy;
      
      return {
        ...state,
        players: {
          ...state.players,
          [playerId]: newPlayer
        },
        playerOrder: newPlayerOrder,
        logs: [...state.logs, `${name} joined the game`]
      };
    }
    case 'START_GAME': {
      if (state.status !== 'Lobby' || state.playerOrder.length === 0) return state;
      
      // Fisher-Yates shuffle the players
      const newPlayerOrder = [...state.playerOrder];
      for (let i = newPlayerOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newPlayerOrder[i], newPlayerOrder[j]] = [newPlayerOrder[j], newPlayerOrder[i]];
      }

      return { ...state, status: 'Playing', playerOrder: newPlayerOrder, currentPlayerIndex: 0 };
    }
    case 'NEW_GAME': {
      const newPlayers = { ...state.players };
      const newPlayerOrder = state.playerOrder.filter(id => !newPlayers[id].isBot);
      for (const id in newPlayers) {
        if (newPlayers[id].isBot) delete newPlayers[id];
      }
      
      return {
        ...state,
        status: 'Lobby',
        winnerId: null,
        chatMessages: [],
        logs: [],
        players: newPlayers,
        playerOrder: newPlayerOrder,
        currentPlayerIndex: 0
      };
    }
    case 'REMOVE_PLAYER': {
      if (state.status !== 'Lobby') return state;
      const { playerId } = action.payload;
      const newPlayers = { ...state.players };
      delete newPlayers[playerId];
      const newPlayerOrder = state.playerOrder.filter(id => id !== playerId);
      return {
        ...state,
        players: newPlayers,
        playerOrder: newPlayerOrder
      };
    }
    case 'UPDATE_BOT_STRATEGY': {
      if (state.status !== 'Lobby') return state;
      const { playerId, botStrategy } = action.payload;
      if (!state.players[playerId]) return state;
      
      return {
        ...state,
        players: {
          ...state.players,
          [playerId]: {
            ...state.players[playerId],
            botStrategy
          }
        }
      };
    }
    case 'SEND_CHAT_MESSAGE': {
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.payload]
      };
    }
    case 'UPDATE_SETTINGS': {
      if (state.status !== 'Lobby') return state;
      return { ...state, settings: { ...(state.settings || {}), ...action.payload } };
    }
    default:
      return state;
  }
}
