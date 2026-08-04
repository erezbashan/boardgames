export type GameStatus = 'Lobby' | 'Playing' | 'Finished';

export interface BasePlayer {
  id: string;
  name: string;
  isBot: boolean;
  botStrategy?: string;
  color?: string;
  isWinner?: boolean;
}

export interface ChatMessage {
  sender: string;
  text: string;
  color?: string;
  isSystem?: boolean;
}

export interface ScheduledAction {
  delayMs: number;
  action: any;
}

export interface GamePrompt {
  playerId: string;
  text: string;
  options: { label: string; action: any; color?: string }[];
}

export interface BaseGameState<TPlayer extends BasePlayer = BasePlayer> {
  status: GameStatus;
  players: Record<string, TPlayer>;
  playerOrder: string[];
  currentPlayerIndex: number;
  winnerId: string | null;
  chatMessages: ChatMessage[];
  logs: string[];
  actionQueue?: ScheduledAction[];
  prompt?: GamePrompt;
}

export type BaseAction = 
  | { type: 'JOIN_GAME', payload: { playerId: string, name: string, isBot: boolean, botStrategy?: string } }
  | { type: 'START_GAME' }
  | { type: 'NEW_GAME' }
  | { type: 'LEAVE_GAME', payload: { playerId: string } }
  | { type: 'REMOVE_PLAYER', payload: { playerId: string } }
  | { type: 'UPDATE_BOT_STRATEGY', payload: { playerId: string, botStrategy: string } }
  | { type: 'SEND_CHAT_MESSAGE', payload: { sender: string, text: string, color?: string } };

export const BOT_NAMES = ["Alice", "Bob", "Charlie", "David", "Eve"];
export const PLAYER_COLORS = ['#3b82f6', '#ef4444', '#eab308', '#a855f7', '#ec4899', '#f97316'];
