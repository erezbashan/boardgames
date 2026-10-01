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
  | { type: 'ADD_KINGDOM_CARD'; cardId: string; amount: number; onComplete?: PlayerAction };

export type DominionAction = PlayerAction | BaseAction;
