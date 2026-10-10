import { BaseGameState, BasePlayer } from '@erez/boardgame-core';
export type Phase = 'ACTION' | 'BUY' | 'CLEANUP';

export interface CardInstance {
  id: string;      // Unique identifier, e.g. "copper_001"
  cardId: string;  // Base card type, e.g. "copper"
  _revealed?: boolean; // Transient flag for reveal animations
}

export interface PlayerState extends BasePlayer {
  id: string;
  name: string;
  isBot: boolean;
  deck: CardInstance[];
  hand: CardInstance[];
  playArea: CardInstance[];
  discard: CardInstance[];
  actions: number;
  buys: number;
  coins: number;
  victoryPoints: number;
  merchantPlays?: number; // For Merchant card
  turnBuyingPower?: number; // Highest coins reached this turn
  transientDeckReveals?: string[];
  transientTrashReveal?: string; // Array of card instances being revealed on top of deck
}

export type PendingAction = 
  | { type: 'DRAW_CARDS'; playerId: string; amount: number }
  | { type: 'GAIN_ACTIONS'; playerId: string; amount: number }
  | { type: 'GAIN_BUYS'; playerId: string; amount: number }
  | { type: 'GAIN_COINS'; playerId: string; amount: number }
  | { type: 'SHUFFLE_DISCARD'; playerId: string }
  | { type: 'REQUEST_INPUT'; playerId: string; inputType: string; payload?: any }
  | { type: 'LOG'; playerId: string; message: string }
  | { type: 'REVEAL_CARD'; playerId: string; instanceId: string; message?: string }
  | { type: 'FORCE_GAIN_CARD'; playerId: string; cardId: string; destination?: 'discard' | 'hand' | 'deck' }
  | { type: 'REVEAL_HAND'; playerId: string }
  | { type: 'BANDIT_ATTACK' | 'BANDIT_DISPOSE'; playerId: string }
  | { type: 'BANDIT_REVEAL_NEXT'; playerId: string; cardsLeft: number; revealedCards: any[] }
  | { type: 'MILITIA_ATTACK'; playerId: string }
  | { type: 'WITCH_ATTACK'; playerId: string }
  | { type: 'BUREAUCRAT_ATTACK'; playerId: string }
  | { type: 'RESOLVE_BANDIT'; playerId: string; revealedCards: any[] }
  | { type: 'CLEAR_MERCHANT'; playerId: string }
  | { type: 'PLAY_MERCHANT'; playerId: string }
  | { type: 'VASSAL_EFFECT'; playerId: string }
  | { type: 'DISCARD_REVEALED_VASSAL'; playerId: string; card: any }
  | { type: 'LIBRARY_DRAW'; playerId: string; setAside: any[] }
  | { type: 'LIBRARY_DRAW_ONE'; playerId: string; setAside: any[] }
  | { type: 'SENTRY_EFFECT'; playerId: string };

export interface HistorySnapshot {
  turnNum: number;
  vps: Record<string, number>;
  deckSizes: Record<string, number>;
  buyingPower: Record<string, number>;
}

export interface DominionSettings {
  kingdomCards: string[]; // Which kingdom cards to include (from the full pool)
  gameLength?: 'Fast' | 'Short' | 'Normal' | 'Marathon'; // Override default number of victory cards
  openGame?: boolean; // If true, all players can see each others' hands
  botParams?: any;

}

export const ALL_KINGDOM_CARDS = [
  'village', 'smithy', 'militia', 'cellar', 'market', 'festival',
  'laboratory', 'council_room', 'moat', 'workshop', 'throne_room', 'chapel',
  'witch', 'moneylender', 'poacher', 'remodel', 'mine',
  'merchant', 'vassal', 'artisan', 'bandit', 'bureaucrat', 'harbinger',
  'library', 'sentry'
];

export interface DominionState extends BaseGameState<PlayerState> {
  phase: Phase;
  supply: Record<string, number>;
  trash: CardInstance[];
  pendingActions: PendingAction[];
  history: HistorySnapshot[];
  recentBuyingPowers?: number[]; // Rolling window of max coins per turn
  settings?: DominionSettings;
  revealedCard?: string;
}
