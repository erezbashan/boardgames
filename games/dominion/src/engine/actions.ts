import { BaseAction } from '@erez/boardgame-core';

export type PlayerAction =
  | { type: 'START_GAME' }
  | { type: 'PLAY_CARD'; playerId: string; instanceId: string }
  | { type: 'BUY_CARD'; playerId: string; cardId: string }
  | { type: 'END_PHASE'; playerId: string }
  | { type: 'RESOLVE_INPUT'; playerId: string; payload: any }
  | { type: 'PLAY_BOT' };

export type DominionAction = PlayerAction | BaseAction;
