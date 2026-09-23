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
import { getBotAction } from './bots/registry';

export const initialAcquireState: AcquireState = {
  ...(baseInitialState as unknown as AcquireState),
  ...createInitialGameState(''),
  status: 'Lobby',
  players: {},
  playerOrder: [],
  history: []
};

function getTickDelay(state: AcquireState): number {
  if (state.settings?.gameSpeed === 'Fast') return 750;
  if (state.settings?.gameSpeed === 'Slow') return 3000;
  if (state.settings?.gameSpeed === 'Ultra') return 1;
  return 1500;
}

function getActivePlayerId(state: AcquireState): string | null {
  if (state.status !== 'Playing') return null;
  if (state.phase === 'FoundCorporation' && state.pendingFounding) return state.pendingFounding.playerId;
  if (state.phase === 'ChooseMergeSurvivor' && state.pendingSurvivorChoice) return state.pendingSurvivorChoice.playerId;
  if (state.phase === 'MergeResolution' && state.pendingMerge) return state.playerOrder[state.pendingMerge.playerResolutionIndex];
  return state.playerOrder[state.currentPlayerIndex];
}

function scheduleBotIfNeeded(state: AcquireState): AcquireState {
  if (state.status !== 'Playing') return state;
  const activeId = getActivePlayerId(state);
  if (!activeId) return state;
  
  const player = state.players[activeId];
  if (!player || !player.isBot) return state;
  
  // Don't schedule if already queued
  if (state.actionQueue && state.actionQueue.some(a => (a.action as any).type === 'PLAY_BOT')) {
    return state;
  }
  
  return {
    ...state,
    actionQueue: [...(state.actionQueue || []), { delayMs: getTickDelay(state), action: { type: 'PLAY_BOT' } }]
  };
}

export function acquireReducer(state: AcquireState, action: AcquireAction & { __isSimulation?: boolean }): AcquireState {
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
    
    return scheduleBotIfNeeded(newState);
  }

  // Handle core actions
  let finalState = state;
  switch (action.type) {
    case 'PLAY_TILE': finalState = playTile(state, action.payload.playerId, action.payload.tileId); break;
    case 'FOUND_CORPORATION': finalState = foundCorporation(state, action.payload.playerId, action.payload.corpName); break;
    case 'BUY_STOCK': finalState = buyStock(state, action.payload.playerId, action.payload.corpName); break;
    case 'END_TURN': finalState = endTurn(state); break;
    case 'CHOOSE_MERGE_SURVIVOR': finalState = chooseMergeSurvivor(state, action.payload.playerId, action.payload.survivorName); break;
    case 'RESOLVE_MERGE_STOCKS': finalState = resolveMergeStocks(state, action.payload.playerId, action.payload.sell, action.payload.trade, action.payload.keep); break;
    case 'PLAY_BOT' as any: {
      const botId = getActivePlayerId(state);
      if (botId && state.players[botId]?.isBot) {
         const botAction = getBotAction(state, botId);
         if (botAction) {
             finalState = acquireReducer(state, { ...botAction, __isSimulation: action.__isSimulation });
         }
      }
      break;
    }
  }

  // Skip delay in simulations
  if (action.__isSimulation && finalState.actionQueue) {
    finalState.actionQueue = finalState.actionQueue.map(a => ({ ...a, delayMs: 0 }));
  }

  return scheduleBotIfNeeded(finalState);
}
