import { baseReducer, baseInitialState } from '@erez/boardgame-core';
import type { AcquireState, AcquireAction } from './types';
import { 
  createInitialGameState,
  startGame,
  playTile, 
  foundCorporation, 
  buyStock, 
  endTurn, 
  chooseMergeSurvivor, 
  resolveMergeStocks 
} from './engine';

export const initialAcquireState: AcquireState = {
  ...(baseInitialState as unknown as AcquireState),
  ...createInitialGameState(''),
  status: 'Lobby',
  players: {},
  playerOrder: [],
  history: []
};

export function acquireReducer(state: AcquireState, action: AcquireAction): AcquireState {
  let newState = baseReducer(state, action) as AcquireState;
  
  if (newState !== state) {
    if (action.type === 'JOIN_GAME') {
      const playerId = action.payload.playerId;
      const basePlayer = newState.players[playerId];
      if (basePlayer && !('money' in basePlayer)) {
        newState = {
          ...newState,
          players: {
            ...newState.players,
            [playerId]: {
              ...(basePlayer as any),
              money: 6000,
              tiles: [],
              stocks: { Tower: 0, Luxor: 0, American: 0, Worldwide: 0, Festival: 0, Imperial: 0, Continental: 0 },
              stats: { chainsFounded: 0, mergesCaused: 0, firstBonuses: 0, secondBonuses: 0, sharesBought: 0 }
            }
          }
        };
      }
    }
    
    if (action.type === 'START_GAME') {
      newState = startGame(newState);
    }
    
    return newState;
  }

  switch (action.type) {
    case 'PLAY_TILE': return playTile(state, action.payload.playerId, action.payload.tileId);
    case 'FOUND_CORPORATION': return foundCorporation(state, action.payload.playerId, action.payload.corpName);
    case 'BUY_STOCK': return buyStock(state, action.payload.playerId, action.payload.corpName);
    case 'END_TURN': return endTurn(state);
    case 'CHOOSE_MERGE_SURVIVOR': return chooseMergeSurvivor(state, action.payload.playerId, action.payload.survivorName);
    case 'RESOLVE_MERGE_STOCKS': return resolveMergeStocks(state, action.payload.playerId, action.payload.sell, action.payload.trade, action.payload.keep);
    default: return state;
  }
}