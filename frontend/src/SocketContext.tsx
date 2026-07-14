import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@king-of-tokyo/shared';
import type { GameState } from '@king-of-tokyo/shared';

interface SocketContextType {
  connected: boolean;
  gameState: GameState | null;
  playerId: string | null;
  createGame: (username: string) => void;
  joinGame: (gameId: string, username: string, previousPlayerId?: string) => void;
  quitGame: (gameId: string) => void;
  returnToLobby: (gameId: string) => void;
  addBot: (gameId: string) => void;
  startGame: (gameId: string) => void;
  rollDice: (gameId: string) => void;
  keepDice: (gameId: string, diceIds: string[]) => void;
  resolveDice: (gameId: string) => void;
  yieldTokyo: (gameId: string, yieldTokyo: boolean) => void;
  buyCard: (gameId: string, cardId: string) => void;
  sweepCards: (gameId: string) => void;
  endTurn: (gameId: string) => void;
  addChatMessage: (gameId: string, message: string) => void;
  sendChat: (gameId: string, text: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    // In production, configure to connect to the actual domain.
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true);
      if (newSocket.id) {
        setPlayerId(newSocket.id);
        localStorage.setItem('kot_playerId', newSocket.id);
      }
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on(SOCKET_EVENTS.GAME_STATE_UPDATE, (state: GameState) => {
      setGameState(state);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const emit = (event: string, ...args: any[]) => {
    if (socket) socket.emit(event, ...args);
  };

  const value: SocketContextType = {
    connected,
    gameState,
    playerId,
    createGame: (username) => emit(SOCKET_EVENTS.CREATE_GAME, username),
    joinGame: (gameId, username, prevPlayerId) => emit(SOCKET_EVENTS.JOIN_GAME, gameId, username, prevPlayerId),
    quitGame: (gameId) => {
      emit(SOCKET_EVENTS.QUIT_GAME, gameId);
      setGameState(null);
      setPlayerId(null);
      localStorage.removeItem('kot_playerId');
    },
    returnToLobby: (gameId) => emit('RETURN_TO_LOBBY', gameId),
    addBot: (gameId) => emit(SOCKET_EVENTS.ADD_BOT, gameId),
    startGame: (gameId) => emit(SOCKET_EVENTS.START_GAME, gameId),
    rollDice: (gameId) => emit(SOCKET_EVENTS.ROLL_DICE, gameId),
    keepDice: (gameId, diceIds) => emit(SOCKET_EVENTS.KEEP_DICE, gameId, diceIds),
    resolveDice: (gameId) => emit(SOCKET_EVENTS.RESOLVE_DICE, gameId),
    yieldTokyo: (gameId, yieldChoice) => emit(SOCKET_EVENTS.YIELD_TOKYO, gameId, yieldChoice),
    buyCard: (gameId, cardId) => emit(SOCKET_EVENTS.BUY_CARD, gameId, cardId),
    sweepCards: (gameId) => emit(SOCKET_EVENTS.SWEEP_CARDS, gameId),
    endTurn: (gameId) => emit(SOCKET_EVENTS.END_TURN, gameId),
    addChatMessage: (gameId, message) => emit(SOCKET_EVENTS.ADD_CHAT_MESSAGE, gameId, message),
    sendChat: (gameId, text) => emit('SEND_CHAT', gameId, text),
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
