import { BaseAction } from '@erez/boardgame-core';

export type PlayerAction =
  | { type: 'START_GAME' }
  | { type: 'UPDATE_SETTINGS'; payload: any }
  | { type: 'PLAY_CARD'; playerId: string; instanceId: string }
  | { type: 'BUY_CARD'; playerId: string; cardId: string }
  | { type: 'END_PHASE'; playerId: string }
  | { type: 'RESOLVE_INPUT'; playerId: string; payload: any }
  | { type: 'PLAY_BOT' }
  | { type: 'AUTO_PLAY_TREASURES'; playerId: string }
  | { type: 'DRAW_CARDS_ASYNC'; playerId: string; amount: number; onComplete?: PlayerAction }
  | { type: 'CLEANUP_PHASE'; playerId: string }
  | { type: 'START_TURN'; playerId: string }
  | { type: 'SHOW_KINGDOM_CARD'; cardId: string; onComplete?: PlayerAction }
  | { type: 'ADD_KINGDOM_CARD'; cardId: string; amount: number; onComplete?: PlayerAction }
  | { type: 'POPUP_CARD'; cardId: string }
  | { type: 'SHOW_DECK_REVEALS'; playerId: string; cardIds: string[]; trashCardId?: string }
  | { type: 'CLEAR_DECK_REVEALS'; playerId: string }
  | { type: 'CLEAR_POPUP' }
  | { type: 'ENQUEUE_PENDING_ACTION'; pendingAction: any }
  | { type: 'BOT_PLAY_VASSAL'; playerId: string; instanceId: string }
  | { type: 'CLEAR_REVEALED'; playerId: string };

export type DominionAction = PlayerAction | BaseAction;
