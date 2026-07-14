export type PlayerId = string;

export interface Player {
  id: PlayerId;
  name: string;
  isBot: boolean;
  health: number;    // max 10 (usually 12 with some cards)
  maxHealth?: number; // defaults to 10
  victoryPoints: number; // max 20
  energy: number;
  inTokyo: boolean;
  cards: Card[];
  hasYielded?: boolean; // temporary flag during resolution
  poisonTokens: number;
  gameStats?: {
    damageDealt: number;
    cardsBought: number;
    energySpent: number;
  };
}

export type DiceFace = '1' | '2' | '3' | 'Heart' | 'Lightning' | 'Claw';

export interface DiceRoll {
  id: string;
  face: DiceFace;
  kept: boolean;
}

export interface Card {
  id: string;
  name: string;
  cost: number;
  type: 'Keep' | 'Discard';
  description: string;
  effect: any; // We can refine this later
}

export interface TurnHistory {
  turnNumber: number;
  playerId: string;
  vp: number;
  health: number;
  energy: number;
}

export interface GameState {
  id: string;
  players: Record<PlayerId, Player>;
  playerOrder: PlayerId[];
  currentTurnPlayerId: PlayerId | null;
  status: 'Lobby' | 'Playing' | 'GameOver';
  winner: PlayerId | null;
  marketCards: Card[];
  deckCount: number;
  deck: Card[];
  
  // Turn state
  rollsLeft: number;
  currentDice: DiceRoll[];
  
  // Animation state
  isAnimating: boolean;
  highlightedDice: string[];
  highlightedStats: { playerId: PlayerId, stat: 'health' | 'energy' | 'vp' }[];
  
  // Resolution state
  pendingYields: PlayerId[]; // players asked if they want to yield Tokyo
  logs: string[];
  chatMessages?: { sender: string, text: string }[];
  history?: TurnHistory[];
}

export const MAX_HEALTH = 10;
export const WIN_VP = 20;

export const SOCKET_EVENTS = {
  // Client to Server
  CREATE_GAME: 'CREATE_GAME',
  JOIN_GAME: 'JOIN_GAME',
  QUIT_GAME: 'QUIT_GAME',
  ADD_BOT: 'ADD_BOT',
  START_GAME: 'START_GAME',
  RESTART_GAME: 'RESTART_GAME',
  RETURN_TO_LOBBY: 'RETURN_TO_LOBBY',
  ROLL_DICE: 'ROLL_DICE',
  KEEP_DICE: 'KEEP_DICE',
  RESOLVE_DICE: 'RESOLVE_DICE',
  YIELD_TOKYO: 'YIELD_TOKYO',
  BUY_CARD: 'BUY_CARD',
  END_TURN: 'END_TURN',
  ADD_CHAT_MESSAGE: 'ADD_CHAT_MESSAGE',
  SEND_CHAT: 'SEND_CHAT',
  REJOIN_GAME: 'REJOIN_GAME',
  SWEEP_CARDS: 'SWEEP_CARDS',
  
  // Server to Client
  GAME_STATE_UPDATE: 'GAME_STATE_UPDATE',
  ERROR: 'ERROR',
  GAMES_LIST: 'GAMES_LIST',
};
