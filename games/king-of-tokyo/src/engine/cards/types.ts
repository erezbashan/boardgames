import type { KotState } from '../../reducer';

export type CardEvent = 
  | 'BEFORE_RESOLVE_ATTACKS' // Modify smash count
  | 'AFTER_ATTACK'        // Fired when player deals damage (Alpha Monster)
  | 'BUY_CARD_EVAL';      // Fired when evaluating cost (Alien Metabolism)

export interface CardEventPayload {
  playerId: string;
  cardOwnerId?: string;
  smashCount?: { smashCount: number };
  damagedSomeone?: boolean;
  cost?: number;
  costModifiers?: string[];
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
