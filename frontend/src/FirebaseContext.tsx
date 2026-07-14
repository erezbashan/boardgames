import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from './engine/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { GameState } from '@king-of-tokyo/shared';

import * as gameEngine from './engine/gameEngine';

interface FirebaseContextType {
  connected: boolean;
  gameState: GameState | null;
  playerId: string | null;
  createGame: (username: string) => void;
  joinGame: (gameId: string, username: string, previousPlayerId?: string) => void;
  quitGame: (gameId: string) => void;
  returnToLobby: (gameId: string) => void;
  addBot: (gameId: string) => void;
  startGame: (gameId: string, settings?: any) => void;
  rollDice: (gameId: string) => void;
  keepDice: (gameId: string, diceIds: string[]) => void;
  resolveDice: (gameId: string) => void;
  yieldTokyo: (gameId: string, yieldChoice: boolean) => void;
  buyCard: (gameId: string, cardId: string) => void;
  sweepCards: (gameId: string) => void;
  endTurn: (gameId: string) => void;
  addChatMessage: (gameId: string, message: string) => void;
  sendChat: (gameId: string, text: string) => void;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [connected] = useState(true);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);

  useEffect(() => {
    const savedId = localStorage.getItem('kot_playerId');
    if (savedId) {
      setPlayerId(savedId);
    } else {
      const newId = Math.random().toString(36).substring(2, 9);
      setPlayerId(newId);
      localStorage.setItem('kot_playerId', newId);
    }
  }, []);

  useEffect(() => {
    if (!currentGameId) return;
    const unsub = onSnapshot(doc(db, 'games', currentGameId), (docSnap) => {
      if (docSnap.exists()) {
        setGameState(docSnap.data() as GameState);
      }
    });
    return () => unsub();
  }, [currentGameId]);

  const value: FirebaseContextType = {
    connected,
    gameState,
    playerId,
    createGame: async (username) => {
      if (!playerId) return;
      const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
      await gameEngine.joinGame(gameId, username, playerId);
      setCurrentGameId(gameId);
    },
    joinGame: async (gameId, username, prev) => {
      if (!playerId) return;
      await gameEngine.joinGame(gameId, username, playerId, prev);
      setCurrentGameId(gameId);
    },
    quitGame: async (gameId) => {
      if (!playerId) return;
      await gameEngine.quitGame(gameId, playerId);
      setCurrentGameId(null);
      setGameState(null);
    },
    returnToLobby: async (gameId) => {
      if (!playerId) return;
      await gameEngine.returnToLobby(gameId, playerId);
    },
    addBot: async (gameId) => {
      if (!playerId) return;
      await gameEngine.addBot(gameId, playerId);
    },
    startGame: async (gameId, _settings) => {
      if (!playerId) return;
      await gameEngine.startGame({ gameId });
    },
    rollDice: async (gameId) => {
      if (!playerId) return;
      await gameEngine.rollDiceAction(gameId, playerId);
    },
    keepDice: async (gameId, diceIds) => {
      if (!playerId) return;
      await gameEngine.keepDice(gameId, diceIds, playerId);
    },
    resolveDice: async (gameId) => {
      if (!playerId) return;
      await gameEngine.resolveDice(gameId, playerId);
    },
    yieldTokyo: async (gameId, yieldChoice) => {
      if (!playerId) return;
      await gameEngine.yieldTokyo(gameId, yieldChoice, playerId);
    },
    buyCard: async (gameId, cardId) => {
      if (!playerId) return;
      await gameEngine.buyCard(gameId, cardId, playerId);
    },
    sweepCards: async (gameId) => {
      if (!playerId) return;
      await gameEngine.sweepCards(gameId, playerId);
    },
    endTurn: async (gameId) => {
      if (!playerId) return;
      await gameEngine.endTurn(gameId, playerId);
    },
    addChatMessage: async (gameId, msg) => {
      if (!playerId) return;
      await gameEngine.sendChat(gameId, msg, playerId);
    },
    sendChat: async (gameId, text) => {
      if (!playerId) return;
      await gameEngine.sendChat(gameId, text, playerId);
    },
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a FirebaseProvider');
  }
  return context;
}
