import type { BaseGameState, BaseAction, BasePlayer } from '@erez/boardgame-core';
import { baseInitialState } from '@erez/boardgame-core';
import { CARD_REGISTRY } from './cards/registry';

export type DiceFace = '1' | '2' | '3' | 'Energy' | 'Heart' | 'Smash';

export interface KotDice {
  id: string;
  value: DiceFace;
  kept: boolean;
}

export interface KotPlayer extends BasePlayer {
  health: number;
  vp: number;
  energy: number;
  location: 'Outside' | 'TokyoCity';
  stats: {
    healthHealed: number;
    energyGained: number;
    damageDealt: number;
    playersKilled: number;
    turnDied?: number;
  };
  cards: string[];
  cardState?: Record<string, any>;
}

export interface PendingAction {
  type: string;
  payload?: any;
  playerId?: string;
  skipPreEvent?: boolean;
  affectedByCards?: { cardId: string, playerId: string }[];
}

export interface KotState extends BaseGameState<KotPlayer> {
  dice: KotDice[];
  rollCount: number;
  settings: {
    maxHealth: number;
    maxVp: number;
    cardsPerType: number;
    startingEnergy: number;
    activeCards: string[];
  };
  deck: string[];
  market: string[];
  turnContext: Record<string, any>;
  pendingActions: PendingAction[];
  logs: string[];
  history: any[];
}

export type KotAction = BaseAction | any;

export const initialKotState: KotState = {
  ...(baseInitialState as unknown as KotState),
  settings: {
    maxHealth: 10,
    maxVp: 20,
    cardsPerType: 1,
    startingEnergy: 0,
    activeCards: Object.keys(CARD_REGISTRY)
  },
  deck: [],
  market: [],
  dice: [
    { id: 'd1', value: '1', kept: false },
    { id: 'd2', value: '2', kept: false },
    { id: 'd3', value: '3', kept: false },
    { id: 'd4', value: 'Heart', kept: false },
    { id: 'd5', value: 'Energy', kept: false },
    { id: 'd6', value: 'Smash', kept: false },
  ],
  rollCount: 0,
  turnContext: {},
  pendingActions: [],
  logs: [],
  history: []
};
