import { BaseGameState, BasePlayer, BaseAction } from '@erez/boardgame-core';

export type GemType = 'diamond' | 'sapphire' | 'emerald' | 'ruby' | 'onyx' | 'gold';
export const BaseGemTypes: Exclude<GemType, 'gold'>[] = ['diamond', 'sapphire', 'emerald', 'ruby', 'onyx'];

export type GemInventory = Record<GemType, number>;

export interface Card {
  id: string;
  tier: 1 | 2 | 3;
  points: number;
  bonus: Exclude<GemType, 'gold'>;
  cost: Omit<GemInventory, 'gold'>;
}

export interface Noble {
  id: string;
  points: number;
  requirements: Omit<GemInventory, 'gold'>;
}

export interface SplendorPlayer extends BasePlayer {
  gems: GemInventory;
  cards: Card[];
  scoreHistory?: number[];
  
  reservedCards: Card[];
  nobles: Noble[];
  score: number;
}

export type SplendorTurnState = 'take_tokens' | 'discard_tokens' | 'choose_noble';

export interface SplendorGameState extends BaseGameState<SplendorPlayer> {
  bank: GemInventory;
  decks: {
    tier1: Card[];
    tier2: Card[];
    tier3: Card[];
  };
  board: {
    tier1: (Card | null)[];
    tier2: (Card | null)[];
    tier3: (Card | null)[];
  };
  nobles: Noble[];
  isFinalRound: boolean;
  turnState: SplendorTurnState;
  pendingDiscardCount: number;
  eligibleNoblesForCurrentPlayer: Noble[];
}

export type SplendorAction = 
  | BaseAction
  | { type: 'TAKE_GEMS'; payload: { gems: Partial<GemInventory> } }
  | { type: 'DISCARD_GEMS'; payload: { gems: Partial<GemInventory> } }
  | { type: 'RESERVE_CARD_BOARD'; payload: { tier: 1 | 2 | 3; cardId: string } }
  | { type: 'RESERVE_CARD_DECK'; payload: { tier: 1 | 2 | 3 } }
  | { type: 'PURCHASE_CARD_BOARD'; payload: { tier: 1 | 2 | 3; cardId: string; autoPay?: boolean } }
  | { type: 'PURCHASE_RESERVED_CARD'; payload: { cardId: string; autoPay?: boolean } }
  | { type: 'CHOOSE_NOBLE'; payload: { nobleId: string } }
  | { type: 'PLAY_BOT' };
