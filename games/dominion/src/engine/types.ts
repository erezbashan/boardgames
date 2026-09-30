import { BaseGameState, BasePlayer } from '@erez/boardgame-core';
export type Phase = 'ACTION' | 'BUY' | 'CLEANUP';

export interface CardInstance {
  id: string;      // Unique identifier, e.g. "copper_001"
  cardId: string;  // Base card type, e.g. "copper"
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
}

export type PendingAction = 
  | { type: 'DRAW_CARDS'; playerId: string; amount: number }
  | { type: 'GAIN_ACTIONS'; playerId: string; amount: number }
  | { type: 'GAIN_BUYS'; playerId: string; amount: number }
  | { type: 'GAIN_COINS'; playerId: string; amount: number }
  | { type: 'SHUFFLE_DISCARD'; playerId: string }
  | { type: 'REQUEST_INPUT'; playerId: string; inputType: string; payload?: any }
  | { type: 'LOG'; playerId: string; message: string };

export interface HistorySnapshot {
  turnNum: number;
  vps: Record<string, number>;
  deckSizes: Record<string, number>;
}

export interface DominionSettings {
  kingdomCards: string[]; // Which kingdom cards to include (from the full pool)
}

export const ALL_KINGDOM_CARDS = [
  'village', 'smithy', 'woodcutter', 'cellar', 'market', 'festival',
  'laboratory', 'council_room', 'moat', 'workshop', 'throne_room', 'chapel'
];

export interface DominionState extends BaseGameState<PlayerState> {
  phase: Phase;
  supply: Record<string, number>;
  trash: CardInstance[];
  pendingActions: PendingAction[];
  history: HistorySnapshot[];
  settings?: DominionSettings;
}
