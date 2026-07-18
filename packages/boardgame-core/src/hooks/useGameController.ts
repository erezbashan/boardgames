import type { BaseAction, BasePlayer } from '../engine/types';
import { BOT_NAMES } from '../engine/types';

export interface GameController {
  handleStart: () => void;
  handleAddBot: () => void;
  handleSendMessage: (msg: string, senderName: string, senderColor?: string) => void;
  handleRemovePlayer: (playerId: string) => void;
  handleNewGame: () => void;
}

export function useGameController(dispatch: (action: BaseAction) => void, gameState?: any): GameController {
  const handleStart = () => {
    dispatch({ type: 'START_GAME' });
  };

  const handleAddBot = () => {
    const existingNames = gameState ? Object.values(gameState.players).map((p: any) => p.name) : [];
    const availableNames = BOT_NAMES.filter(n => !existingNames.includes(n));
    const botName = availableNames.length > 0 
      ? availableNames[Math.floor(Math.random() * availableNames.length)] 
      : `Bot ${Math.floor(Math.random() * 1000)}`;
      
    const botId = 'bot-' + Math.random().toString(36).substring(2, 6);
    dispatch({ type: 'JOIN_GAME', payload: { playerId: botId, name: botName, isBot: true, botStrategy: 'random' } });
  };

  const handleSendMessage = (msg: string, senderName: string, senderColor?: string) => {
    dispatch({ 
      type: 'SEND_CHAT_MESSAGE', 
      payload: { sender: senderName, text: msg, color: senderColor } 
    });
  };

  const handleRemovePlayer = (playerId: string) => {
    dispatch({ type: 'REMOVE_PLAYER', payload: { playerId } });
  };

  const handleNewGame = () => {
    dispatch({ type: 'NEW_GAME' });
  };

  return { handleStart, handleAddBot, handleSendMessage, handleRemovePlayer, handleNewGame };
}
