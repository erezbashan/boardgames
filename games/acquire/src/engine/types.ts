import type { BaseGameState, BasePlayer, BaseAction } from '@erez/boardgame-core';

export type Corporation =
  | 'Tower'
  | 'Luxor'
  | 'American'
  | 'Worldwide'
  | 'Festival'
  | 'Imperial'
  | 'Continental';

export type TileId = `${number}${string}`; // e.g., '1A', '9L'

export interface Tile {
  id: TileId;
  row: number; // 0-8 (for 1-9)
  col: number; // 0-11 (for A-L)
}

export type BoardCell = Corporation | 'Unincorporated' | null;

export interface AcquirePlayer extends BasePlayer {
  money: number;
  tiles: Tile[];
  stocks: Record<Corporation, number>;
  stats: {
    chainsFounded: number;
    mergesCaused: number;
    firstBonuses: number;
    secondBonuses: number;
    sharesBought: number;
  };
}

export interface CorporationState {
  name: Corporation;
  size: number; // Number of tiles
  stockPrice: number;
  majorityBonus: number;
  minorityBonus: number;
  availableStocks: number;
  isSafe: boolean; // Size >= 11
  isActive: boolean; // Has been founded
}

export type AcquirePhase =
  | 'PlayTile'
  | 'FoundCorporation'
  | 'BuyStocks'
  | 'ChooseMergeSurvivor'
  | 'MergeResolution'
  | 'DrawTile'
  | 'GameOver';

export interface AcquireState extends BaseGameState<AcquirePlayer> {
  board: Record<number, BoardCell[]>; // 9x12 grid
  corporations: Record<Corporation, CorporationState>;
  availableTiles: Tile[];
  phase: AcquirePhase;
  sharesBoughtThisTurn: number; // Max 3
  history: { turn: number, netWorths: Record<string, number> }[];
  turnContext?: any;
  
  // Pending state for merges
  pendingMerge?: {
    mergerId: string; // Player who caused it
    acquirer: Corporation;
    defunct: Corporation[];
    currentDefunctIndex: number;
    playerResolutionIndex: number; // Which player is currently resolving their stocks
    playersResolved: string[]; // Players who have resolved this defunct corp
    defunctTiles: { row: number, col: number, corp: Corporation }[];
  };

  // Pending state for survivor choice
  pendingSurvivorChoice?: {
    playerId: string;
    tileId: TileId;
    tiedCorps: Corporation[];
    allCorpsInvolved: Corporation[];
  };
  pendingFounding?: {
    playerId: string;
    tileId: TileId;
    availableCorps: Corporation[];
    size: number;
  };
}

export type AcquireAction =
  | BaseAction
  | { type: 'PLAY_TILE', payload: { playerId: string, tileId: TileId } }
  | { type: 'FOUND_CORPORATION', payload: { playerId: string, corpName: Corporation } }
  | { type: 'BUY_STOCK', payload: { playerId: string, corpName: Corporation } }
  | { type: 'END_TURN', payload: { playerId: string } }
  | { type: 'CHOOSE_MERGE_SURVIVOR', payload: { playerId: string, survivorName: Corporation } }
  | { type: 'RESOLVE_MERGE_STOCKS', payload: { playerId: string, sell: number, trade: number, keep: number } };

