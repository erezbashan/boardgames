import type { BaseGameState, BaseAction } from '@erez/boardgame-core';
import { baseReducer, baseInitialState } from '@erez/boardgame-core';

import type { BasePlayer } from '@erez/boardgame-core';

export interface FlipsPlayer extends BasePlayer {
  score: number;
  headsCount: number;
  tailsCount: number;
  pointsHistory: number[];
}

export interface FlipsState extends BaseGameState {
  targetScore: number;
  currentPlayerIndex: number;
  players: Record<string, FlipsPlayer>;
  lastFlipResult: { playerId: string, isHeads: boolean } | null;
}

export type FlipsAction = 
  | BaseAction
  | { type: 'FLIP_COIN', payload: { playerId: string, isHeads: boolean } }
  | { type: 'SET_TARGET_SCORE', payload: { targetScore: number } };

export const initialFlipsState: FlipsState = {
  ...baseInitialState,
  targetScore: 3,
  currentPlayerIndex: 0,
  lastFlipResult: null,
  players: {}
};

export function flipsReducer(state: FlipsState, action: FlipsAction): FlipsState {
  // Pass to base reducer first to handle JOIN_GAME, START_GAME, NEW_GAME, SEND_CHAT_MESSAGE
  let newState = baseReducer(state, action) as FlipsState;
  
  if (newState !== state) {
    // If a new player joined, we need to initialize their Flips-specific fields
    if (action.type === 'JOIN_GAME') {
      const playerId = action.payload.playerId;
      const basePlayer = newState.players[playerId];
      if (basePlayer && !('score' in basePlayer)) {
        newState = {
          ...newState,
          players: {
            ...newState.players,
            [playerId]: {
              ...(basePlayer as any),
              score: 0,
              headsCount: 0,
              tailsCount: 0,
              pointsHistory: [0]
            }
          }
        };
      }
    }
    
    // If game started, init currentPlayerIndex
    if (action.type === 'START_GAME') {
      newState = { ...newState, currentPlayerIndex: 0, lastFlipResult: null };
    }
    
    // If new game, reset player points
    if (action.type === 'NEW_GAME') {
      const resetPlayers: Record<string, FlipsPlayer> = {};
      Object.keys(newState.players).forEach(pId => {
        resetPlayers[pId] = { 
          ...newState.players[pId], 
          score: 0, 
          headsCount: 0, 
          tailsCount: 0, 
          pointsHistory: [0] 
        } as FlipsPlayer;
      });
      newState = { ...newState, currentPlayerIndex: 0, lastFlipResult: null, players: resetPlayers };
    }

    return newState;
  }

  // Handle Flips-specific actions
  switch (action.type) {
    case 'SET_TARGET_SCORE': {
      if (state.status !== 'Lobby') return state;
      return { ...state, targetScore: action.payload.targetScore };
    }
    case 'FLIP_COIN': {
      if (state.status !== 'Playing') return state;
      if (state.playerOrder[state.currentPlayerIndex] !== action.payload.playerId) return state;

      const player = state.players[action.payload.playerId];
      const isHeads = action.payload.isHeads;
      const newScore = player.score + (isHeads ? 1 : 0);
      
      const newPlayerState = {
        ...player,
        score: newScore,
        headsCount: player.headsCount + (isHeads ? 1 : 0),
        tailsCount: player.tailsCount + (isHeads ? 0 : 1),
        pointsHistory: [...player.pointsHistory, newScore]
      };

      // Pad others
      const updatedPlayers = { ...state.players, [action.payload.playerId]: newPlayerState };
      for (const pId of state.playerOrder) {
        if (pId !== action.payload.playerId) {
          updatedPlayers[pId] = {
            ...updatedPlayers[pId],
            pointsHistory: [...updatedPlayers[pId].pointsHistory, updatedPlayers[pId].score]
          };
        }
      }

      const hasWon = newScore >= state.targetScore;
      let newStatus = state.status;
      let newWinnerId = state.winnerId;

      if (hasWon) {
        newStatus = 'Finished' as any;
        newWinnerId = action.payload.playerId;
      }

      const systemMessage = {
        sender: 'System',
        text: `${player.name} flipped ${isHeads ? 'Heads' : 'Tails'}!`,
        isSystem: true
      };

      return {
        ...state,
        players: updatedPlayers,
        status: newStatus,
        winnerId: newWinnerId,
        currentPlayerIndex: (state.currentPlayerIndex + 1) % state.playerOrder.length,
        lastFlipResult: { playerId: action.payload.playerId, isHeads },
        chatMessages: [...state.chatMessages, systemMessage]
      };
    }
    default:
      return state;
  }
}
