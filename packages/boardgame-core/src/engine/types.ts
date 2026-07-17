export type GameStatus = 'Lobby' | 'Playing' | 'Finished';

export interface BasePlayer {
  id: string;
  name: string;
  isBot: boolean;
  color?: string;
  isWinner?: boolean;
}

export interface ChatMessage {
  sender: string;
  text: string;
  color?: string;
  isSystem?: boolean;
}

export interface BaseGameState {
  status: GameStatus;
  players: Record<string, BasePlayer>;
  playerOrder: string[];
  winnerId: string | null;
  chatMessages: ChatMessage[];
}

export type BaseAction = 
  | { type: 'JOIN_GAME', payload: { playerId: string, name: string, isBot: boolean } }
  | { type: 'START_GAME' }
  | { type: 'NEW_GAME' }
  | { type: 'LEAVE_GAME', payload: { playerId: string } }
  | { type: 'SEND_CHAT_MESSAGE', payload: { sender: string, text: string, color?: string } };

export const BOT_NAMES = ["Alice", "Bob", "Charlie", "David", "Eve"];
export const PLAYER_COLORS = ['#3b82f6', '#ef4444', '#eab308', '#a855f7', '#ec4899', '#f97316'];
