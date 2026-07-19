import type { KotState } from '../reducer';

export type CardEvent = 
  | 'BEFORE_RESOLVE_ATTACKS' // Modify smash count
  | 'AFTER_ATTACK'        // Fired when player deals damage (Alpha Monster)
  | 'BUY_CARD_EVAL'       // Fired when evaluating cost (Alien Metabolism)
  | 'BUY_CARD'            // Fired when actually buying a card
  | 'BEFORE_TAKE_DAMAGE'  // Fired before taking damage
  | 'BEFORE_RESOLVE_DICE' // Fired before resolving dice
  | 'CARD_ACTION'         // Fired when user answers a card prompt
  | 'YIELD_TOKYO'         // Fired when a player yields Tokyo
  | 'END_TURN'            // Fired at the end of a player's turn
  | 'MONSTER_DIED';       // Fired when a player's health reaches 0

export interface CardEventPayload {
  playerId: string;
  cardOwnerId?: string;
  smashCount?: { smashCount: number };
  damagedSomeone?: boolean;
  cost?: number;
  cardId?: string;
  [key: string]: any;     // Other event-specific data (e.g., cost, damagedSomeone)
}

export interface KotCard {
  id: string;
  name: string;
  cost: number;
  type: 'Keep' | 'Discard';
  description: string;
  onEvent?: (event: CardEvent, payload: CardEventPayload, state: KotState) => KotState | void;
}
