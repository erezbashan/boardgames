import { AcquireState, AcquireAction, Corporation } from '../types';
import { Bot } from './Bot';
import { getAdjacentCells } from '../engine';

const CORPORATIONS: Corporation[] = ['Tower', 'Luxor', 'American', 'Worldwide', 'Festival', 'Imperial', 'Continental'];

export class HeuristicBot implements Bot {
  name = 'HeuristicBot';

  private evaluateTile(state: AcquireState, playerId: string, tileId: string): number {
    const player = state.players[playerId];
    if (!player) return -10000;

    const match = tileId.match(/^(\d+)([A-Z])$/);
    if (!match) return -10000;
    
    const row = parseInt(match[1]) - 1;
    const col = match[2].charCodeAt(0) - 65;
    
    const neighbors = getAdjacentCells(state.board, row, col);
    const adjacentCorps = Array.from(new Set(neighbors.map(n => n.val).filter(val => val !== null && val !== 'Unincorporated'))) as Corporation[];
    const adjacentUnincorporated = neighbors.filter(n => n.val === 'Unincorporated');

    if (adjacentCorps.length > 1) {
      const safeCorps = adjacentCorps.filter(c => state.corporations[c].isSafe);
      if (safeCorps.length > 1) return -10000;
    }
    if (adjacentCorps.length === 0 && adjacentUnincorporated.length > 0) {
      const availableCorps = CORPORATIONS.filter(c => !state.corporations[c].isActive);
      if (availableCorps.length === 0) return -10000;
    }

    if (adjacentCorps.length > 1) {
      const sortedCorps = [...adjacentCorps].sort((a, b) => state.corporations[b].size - state.corporations[a].size);
      const defunctCorps = sortedCorps.slice(1);
      let mergerScore = 0;
      for (const dCorp of defunctCorps) {
        const myStocks = player.stocks[dCorp] || 0;
        if (myStocks > 0) {
          const holders = Object.values(state.players).map((p: any) => ({ id: p.id, count: p.stocks[dCorp] || 0 })).filter(h => h.count > 0).sort((a,b) => b.count - a.count);
          if (holders.length > 0 && holders[0].id === playerId) {
            mergerScore += 1000;
          } else if (holders.length > 1 && holders[1].id === playerId) {
            mergerScore += 500;
          } else {
            mergerScore += 200;
          }
        }
      }
      if (mergerScore > 0) return mergerScore;
      return -200;
    }
    
    if (adjacentCorps.length === 0 && adjacentUnincorporated.length > 0) {
      return 500;
    }
    
    if (adjacentCorps.length === 1) {
      const corp = adjacentCorps[0];
      const myStocks = player.stocks[corp] || 0;
      const holders = Object.values(state.players).map((p: any) => ({ id: p.id, count: p.stocks[corp] || 0 })).filter(h => h.count > 0).sort((a,b) => b.count - a.count);
      
      if (holders.length > 0 && holders[0].id === playerId) {
        return 200;
      }
      if (myStocks === 0 && state.corporations[corp].size >= 8) {
        return -500;
      }
      return 50;
    }
    return 0;
  }

  takeTurn(state: AcquireState, playerId: string): AcquireAction | null {
    const currentPlayer = state.players[playerId];
    if (!currentPlayer) return null;

    if (state.phase === 'PlayTile') {
      if (currentPlayer.tiles.length === 0) return { type: 'END_TURN', payload: { playerId } };
      let bestTile = currentPlayer.tiles[0];
      let bestScore = -Infinity;
      
      const playableTiles = currentPlayer.tiles.filter(t => this.evaluateTile(state, playerId, t.id) > -9000);
      
      if (playableTiles.length > 0) {
        for (const tile of playableTiles) {
          const score = this.evaluateTile(state, playerId, tile.id);
          if (score > bestScore) {
            bestScore = score;
            bestTile = tile;
          } else if (score === bestScore && Math.random() > 0.5) {
            bestTile = tile;
          }
        }
        return { type: 'PLAY_TILE', payload: { playerId, tileId: bestTile.id } };
      } else {
        return { type: 'PLAY_TILE', payload: { playerId, tileId: currentPlayer.tiles[0].id } };
      }
    } 
    
    if (state.phase === 'FoundCorporation' && state.pendingFounding?.playerId === playerId) {
      const tierMap: Record<string, number> = {
        'Tower': 1, 'Luxor': 1,
        'American': 2, 'Worldwide': 2, 'Festival': 2,
        'Imperial': 3, 'Continental': 3
      };
      let bestCorp = state.pendingFounding.availableCorps[0];
      let bestTier = 4;
      
      for (const corp of state.pendingFounding.availableCorps) {
        if ((currentPlayer.stocks[corp] || 0) > 0) {
          bestCorp = corp;
          break;
        }
        if (tierMap[corp] < bestTier) {
          bestTier = tierMap[corp];
          bestCorp = corp;
        }
      }
      return { type: 'FOUND_CORPORATION', payload: { playerId, corpName: bestCorp } };
    } 
    
    if (state.phase === 'ChooseMergeSurvivor' && state.pendingSurvivorChoice?.playerId === playerId) {
      const tiedCorps = state.pendingSurvivorChoice.tiedCorps;
      let bestCorp = tiedCorps[0];
      let maxStocks = -1;
      
      for (const corp of tiedCorps) {
        const myStocks = currentPlayer.stocks[corp] || 0;
        if (myStocks > maxStocks) {
          maxStocks = myStocks;
          bestCorp = corp;
        }
      }
      return { type: 'CHOOSE_MERGE_SURVIVOR', payload: { playerId, survivorName: bestCorp } };
    } 
    
    if (state.phase === 'MergeResolution' && state.pendingMerge && state.playerOrder[state.pendingMerge.playerResolutionIndex] === playerId) {
      const pm = state.pendingMerge;
      const dCorp = pm.defunct[pm.currentDefunctIndex];
      const aCorp = pm.acquirer;
      const currentStocks = currentPlayer.stocks[dCorp] || 0;
      
      const acquirerAvailable = state.corporations[aCorp].availableStocks;
      const maxPossibleTrades = Math.floor(currentStocks / 2) * 2;
      const actualTrades = Math.min(maxPossibleTrades, acquirerAvailable * 2);
      
      const tradeCount = actualTrades;
      const sellCount = currentStocks - tradeCount;
      const keepCount = 0;
      
      return { type: 'RESOLVE_MERGE_STOCKS', payload: { playerId, sell: sellCount, trade: tradeCount, keep: keepCount } };
    } 
    
    if (state.phase === 'BuyStocks') {
      if (state.sharesBoughtThisTurn >= 3) return { type: 'END_TURN', payload: { playerId } };
      
      const activeCorps = CORPORATIONS.filter(c => state.corporations[c].isActive && state.corporations[c].availableStocks > 0);
      let bestCorp: Corporation | null = null;
      let bestScore = -Infinity;
      
      for (const corp of activeCorps) {
        if (state.corporations[corp].availableStocks <= 0) continue;
        if (state.corporations[corp].stockPrice > currentPlayer.money) continue;
        
        let score = 0;
        const corpData = state.corporations[corp];
        
        if (corpData.size >= 8 && !corpData.isSafe) score += 100;
        
        const myStocks = (currentPlayer.stocks[corp] || 0) + 1;
        const holders = Object.values(state.players).map((p: any) => ({ id: p.id, count: p.id === playerId ? myStocks : (p.stocks[corp] || 0) })).sort((a,b) => b.count - a.count);
        
        if (holders[0].id === playerId) score += 50;
        else if (holders[1]?.id === playerId) score += 30;
        
        score -= corpData.stockPrice / 100;
        
        if (score > bestScore) {
          bestScore = score;
          bestCorp = corp;
        }
      }
      
      if (bestCorp) {
        return { type: 'BUY_STOCK', payload: { playerId, corpName: bestCorp } };
      }
      return { type: 'END_TURN', payload: { playerId } };
    }

    return null;
  }
}
