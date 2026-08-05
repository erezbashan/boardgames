import { BaseGameState } from './types';

export interface PlayerConfig {
  id: string;
  botStrategy: string;
}

export interface SimulationResult {
  winnerId: string | null;
  winnerStrategy: string | null;
  error?: string;
  totalTurns?: number;
}

export function runSimulationBatch(
  reducer: (state: any, action: any) => any,
  initialState: BaseGameState,
  playerConfigs: PlayerConfig[],
  batchSize: number,
  onProgress: (results: SimulationResult[]) => void
) {
  let results: SimulationResult[] = [];
  
  // A helper function to run one full game
  const runSingleGame = (): SimulationResult => {
    let state = initialState;
    
    // Join players
    for (const p of playerConfigs) {
      state = reducer(state, { 
        type: 'JOIN_GAME', 
        payload: { playerId: p.id, name: p.id, isBot: true, botStrategy: p.botStrategy } 
      });
    }
    
    // Start Game
    state = reducer(state, { type: 'START_GAME' });
    
    let loopCount = 0;
    while (state.status !== 'Finished' && loopCount < 50000) {
      if (state.actionQueue && state.actionQueue.length > 0) {
        const action = state.actionQueue[0].action;
        state = { ...state, actionQueue: state.actionQueue.slice(1) };
        state = reducer(state, action);
      } else {
        // Queue is empty but game not finished. 
        return { winnerId: null, winnerStrategy: null, error: 'Queue empty before game finished' };
      }
      loopCount++;
    }
    
    if (loopCount >= 50000) {
      return { winnerId: null, winnerStrategy: null, error: 'Infinite loop detected' };
    }
    
    const winnerId = state.winnerId;
    const winnerPlayer = winnerId ? state.players[winnerId] : null;
    return {
      winnerId,
      winnerStrategy: winnerPlayer?.botStrategy || null,
      totalTurns: loopCount
    };
  };

  for (let i = 0; i < batchSize; i++) {
    try {
       results.push(runSingleGame());
    } catch (e: any) {
       results.push({ winnerId: null, winnerStrategy: null, error: e.message || 'Unknown error' });
    }
  }

  onProgress(results);
}
