import { AcquireState, AcquireAction, Corporation } from '../types';
import { Bot } from './Bot';
import { getAdjacentCells, calculateNetWorth } from '../engine';

const CORPORATIONS: Corporation[] = ['Tower', 'Luxor', 'American', 'Worldwide', 'Festival', 'Imperial', 'Continental'];

export class HeuristicBot implements Bot {
  name = 'HeuristicBot';

  thresholds = {
    idealCash: 1500,
    hoardingPenalty: 200,
    insiderTradingBonus: 200,
    acquirerPrepBonus: 150,
    desperateCash: 500,
    resurrectionMaxCorps: 4,
    resurrectionMaxTiles: 30
  };




  features = {
    endGameAwareness: true,
    smartMergeResolution: true,
    defensiveMerging: true,
    multiWayMergeOpt: true,
    stockStarvation: true
  };

  constructor(config?: { features?: Partial<HeuristicBot['features']>, thresholds?: Partial<HeuristicBot['thresholds']> }) {
    if (config?.features) this.features = { ...this.features, ...config.features };
    if (config?.thresholds) this.thresholds = { ...this.thresholds, ...config.thresholds };
  }





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
      let IDEAL_CASH = this.thresholds.idealCash;
      const cashMultiplier = player.money < IDEAL_CASH ? 1 + ((IDEAL_CASH - player.money) / IDEAL_CASH) : 1;
      
      for (const dCorp of defunctCorps) {
        const holders = Object.values(state.players).map((p: any) => ({ id: p.id, count: p.stocks[dCorp] || 0 })).filter(h => h.count > 0).sort((a,b) => b.count - a.count);
        
        let payout = 0;
        let opponentPayout = 0;
        let iAmFirst = false;
        
        if (holders.length > 0) {
            if (holders[0].id === playerId) {
                iAmFirst = true;
                payout += state.corporations[dCorp].majorityBonus;
                if (holders.length === 1) payout += state.corporations[dCorp].minorityBonus;
            } else {
                opponentPayout += state.corporations[dCorp].majorityBonus;
            }
            
            if (holders.length > 1) {
                if (holders[1].id === playerId) {
                    payout += state.corporations[dCorp].minorityBonus;
                } else {
                    opponentPayout += state.corporations[dCorp].minorityBonus;
                }
            }
        }
        
        if (!iAmFirst) {
            mergerScore -= this.thresholds.hoardingPenalty; // Hoard the tile if we don't have majority, but not too strictly
        
        if (this.features.defensiveMerging) {
            if (state.corporations[dCorp].size === 9 || state.corporations[dCorp].size === 10) {
                if (!iAmFirst && opponentPayout > 0) {
                   // They are about to lock it! Destroy it early!
                   mergerScore += 600; // override the hoarding penalty
                }
            }
        }

        }
        
        if (payout > 0) {
            mergerScore += (payout / 4) * cashMultiplier;
        }
        if (opponentPayout > 0) {
            mergerScore -= (opponentPayout / 6);
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
      
      let baseScore = 0;
      if (holders.length > 0 && holders[0].id === playerId) {
        baseScore = 200;
      } else if (myStocks === 0 && state.corporations[corp].size >= 8) {
        baseScore = -500;
      } else {
        baseScore = 50;
      }
      
      let isAcquirerInHand = false;
      for (const t of player.tiles) {
        if (t.id === tileId) continue;
        const match = t.id.match(/^(\d+)([A-Z])$/);
        if (!match) continue;
        const r = parseInt(match[1]) - 1;
        const c = match[2].charCodeAt(0) - 65;
        const nbrs = getAdjacentCells(state.board, r, c);
        const adj = Array.from(new Set(nbrs.map(n => n.val).filter(val => val !== null && val !== 'Unincorporated'))) as Corporation[];
        if (adj.length > 1 && adj.includes(corp)) {
            const sorted = [...adj].sort((a,b) => state.corporations[b].size - state.corporations[a].size);
            if (sorted[0] === corp || (sorted[1] === corp && state.corporations[sorted[0]].size === state.corporations[corp].size)) {
                isAcquirerInHand = true;
                break;
            }
        }
      }
      
      if (isAcquirerInHand) {
          baseScore += this.thresholds.acquirerPrepBonus; // Boost growing this chain so we can safely merge into it
      }
      
      
    if (this.features.endGameAwareness) {
      let maxWorth = -Infinity;
      let myWorth = calculateNetWorth(state, playerId);
      let isWinning = true;
      for (const pId of state.playerOrder) {
         if (pId !== playerId) {
            const w = calculateNetWorth(state, pId);
            if (w > maxWorth) maxWorth = w;
            if (w >= myWorth) isWinning = false;
         }
      }
      
      // If we are winning and this tile grows a big chain (>30), boost it to end game
      // If losing, penalize it to stall
      if (adjacentCorps.length === 1) {
         const corpSize = state.corporations[adjacentCorps[0]].size;
         if (corpSize >= 30) {
            if (isWinning) baseScore += 1000;
            else baseScore -= 1000;
         }
      }
      
      // Also apply cash dumping logic in BuyStocks
    }

      return baseScore;
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
      let bestScore = -Infinity;
      
      for (const corp of state.pendingFounding.availableCorps) {
        let score = 0;
        if ((currentPlayer.stocks[corp] || 0) > 0) score += 500; // Heavily favor corps we already own
        
        let IDEAL_CASH = this.thresholds.idealCash;
        if (currentPlayer.money < IDEAL_CASH) {
            // Found cheap corps to afford them
            score += (4 - tierMap[corp]) * 50;
        } else {
            // Found expensive corps for higher value free stock
            score += tierMap[corp] * 50;
        }
        
        if (score > bestScore) {
            bestScore = score;
            bestCorp = corp;
        }
      }
      return { type: 'FOUND_CORPORATION', payload: { playerId, corpName: bestCorp } };
    } 
    
    
    if (state.phase === 'ChooseMergeSurvivor' && state.pendingSurvivorChoice?.playerId === playerId) {
      if (this.features.multiWayMergeOpt) {
          const tiedCorps = state.pendingSurvivorChoice.tiedCorps;
          let bestCorp = tiedCorps[0];
          let bestPayout = -1;
          
          for (const survivor of tiedCorps) {
              let expectedPayout = 0;
              for (const defunct of state.pendingSurvivorChoice.allCorpsInvolved) {
                  if (defunct === survivor) continue;
                  
                  const holders = Object.values(state.players).map((p: any) => ({ id: p.id, count: p.stocks[defunct] || 0 })).filter(h => h.count > 0).sort((a,b) => b.count - a.count);
                  if (holders.length > 0 && holders[0].id === playerId) {
                      expectedPayout += state.corporations[defunct].majorityBonus;
                      if (holders.length === 1) expectedPayout += state.corporations[defunct].minorityBonus;
                  } else if (holders.length > 1 && holders[1].id === playerId) {
                      expectedPayout += state.corporations[defunct].minorityBonus;
                  }
              }
              if (expectedPayout > bestPayout) {
                  bestPayout = expectedPayout;
                  bestCorp = survivor;
              } else if (expectedPayout === bestPayout) {
                  // tie breaker: keep the one we have most stocks in
                  const s1 = currentPlayer.stocks[survivor] || 0;
                  const s2 = currentPlayer.stocks[bestCorp] || 0;
                  if (s1 > s2) bestCorp = survivor;
              }
          }
          return { type: 'CHOOSE_MERGE_SURVIVOR', payload: { playerId, survivorName: bestCorp } };
      }

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
      
      let tradeCount = 0;
      let keepCount = 0;
      let sellCount = 0;

      if (!this.features.smartMergeResolution) {
          const maxPossibleTrades = Math.floor(currentStocks / 2) * 2;
          const actualTrades = Math.min(maxPossibleTrades, acquirerAvailable * 2);
          tradeCount = actualTrades;
          sellCount = currentStocks - tradeCount;
      } else {
          let remainingToProcess = currentStocks;
          const aMyStocks = currentPlayer.stocks[aCorp] || 0;
          const aOtherHolders = Object.values(state.players).filter((p: any) => p.id !== playerId).map((p: any) => p.stocks[aCorp] || 0).sort((a,b) => b - a);
          const aSecondPlace = aOtherHolders[0] || 0;
          const needAcquirerStocks = aMyStocks <= (aSecondPlace + acquirerAvailable);
          
          const aPrice = state.corporations[aCorp].stockPrice;
          const dPrice = state.corporations[dCorp].stockPrice;
          const isTradeProfitable = aPrice > (2 * dPrice);
          
          const IDEAL_CASH = this.thresholds.idealCash;
          const desperateForCash = currentPlayer.money < this.thresholds.desperateCash;
          const needCash = currentPlayer.money < IDEAL_CASH;
          
          const maxPairs = Math.min(Math.floor(remainingToProcess / 2), acquirerAvailable);
          
          if (maxPairs > 0) {
              if (needAcquirerStocks || (isTradeProfitable && !desperateForCash)) {
                  tradeCount = maxPairs * 2;
                  remainingToProcess -= tradeCount;
              }
          }
          
          const activeCorpsCount = Object.values(state.corporations).filter(c => c.isActive).length;
          const resurrectionLikely = activeCorpsCount <= this.thresholds.resurrectionMaxCorps && Object.values(state.corporations).reduce((acc, c) => acc + c.size, 0) < this.thresholds.resurrectionMaxTiles;
          
          if (remainingToProcess > 0) {
              if (resurrectionLikely && !needCash) {
                  keepCount = remainingToProcess;
              } else {
                  sellCount = remainingToProcess;
              }
          }
      }

      return { type: 'RESOLVE_MERGE_STOCKS', payload: { playerId, sell: sellCount, trade: tradeCount, keep: keepCount } };
    }
    
    if (state.phase === 'BuyStocks') {
      if (state.sharesBoughtThisTurn >= 3) return { type: 'END_TURN', payload: { playerId } };
      
      const activeCorps = CORPORATIONS.filter(c => state.corporations[c].isActive && state.corporations[c].availableStocks > 0);
      let bestCorp: Corporation | null = null;
      let bestScore = -Infinity;
      
      // Identify potential merges we hold in hand
      const mergingCorpsInHand = new Set<Corporation>();
      for (const t of currentPlayer.tiles) {
        const match = t.id.match(/^(\d+)([A-Z])$/);
        if (!match) continue;
        const row = parseInt(match[1]) - 1;
        const col = match[2].charCodeAt(0) - 65;
        const neighbors = getAdjacentCells(state.board, row, col);
        const adjacentCorps = Array.from(new Set(neighbors.map(n => n.val).filter(val => val !== null && val !== 'Unincorporated'))) as Corporation[];
        if (adjacentCorps.length > 1) {
            // Find which corps would become defunct
            const sorted = [...adjacentCorps].sort((a,b) => state.corporations[b].size - state.corporations[a].size);
            for (let i = 1; i < sorted.length; i++) {
                mergingCorpsInHand.add(sorted[i]);
            }
        }
      }
      
      for (const corp of activeCorps) {
        if (state.corporations[corp].availableStocks <= 0) continue;
        if (state.corporations[corp].stockPrice > currentPlayer.money) continue;
        
        let score = 0;
        const corpData = state.corporations[corp];
        
        if (!corpData.isSafe) {
            if (corpData.size === 10) score += 150;
            else if (corpData.size === 9) score += 120;
            else if (corpData.size >= 8) score += 100;
        }
        
        const currentMyStocks = currentPlayer.stocks[corp] || 0;
        const myStocks = currentMyStocks + 1;
        const holders = Object.values(state.players).map((p: any) => ({ id: p.id, count: p.id === playerId ? myStocks : (p.stocks[corp] || 0) })).sort((a,b) => b.count - a.count);
        
        const otherHolders = Object.values(state.players).filter((p: any) => p.id !== playerId).map((p: any) => p.stocks[corp] || 0).sort((a,b) => b - a);
        const secondPlace = otherHolders[0] || 0;
        const available = corpData.availableStocks;
        
        const isGuaranteedFirst = currentMyStocks > (secondPlace + available);
        
        if (isGuaranteedFirst) {
          score -= 150; 
        } else {
          if (holders[0].id === playerId) score += 50;
          else if (holders[1]?.id === playerId) score += 30;
          
          // Insider Trading: prioritize stocks of corps we can forcefully merge
          if (mergingCorpsInHand.has(corp)) {
              score += this.thresholds.insiderTradingBonus; // Big boost to get stocks in defunct chains we control the trigger for
          }
        }
        
        score -= corpData.stockPrice / 100;
        
        const remainingCash = currentPlayer.money - corpData.stockPrice;
        let IDEAL_CASH = this.thresholds.idealCash;
        
        if (this.features.endGameAwareness) {
           let isWinning = true;
           let myWorth = calculateNetWorth(state, playerId);
           for (const pId of state.playerOrder) {
             if (pId !== playerId && calculateNetWorth(state, pId) >= myWorth) isWinning = false;
           }
           
           // If a chain is > 35, game is ending very soon. Dump cash.
           const activeCorps = Object.values(state.corporations).filter(c => c.isActive);
           const closeToEnd = activeCorps.some(c => c.size >= 35) || (activeCorps.length > 0 && activeCorps.every(c => c.isSafe));
           
           if (closeToEnd) {
               IDEAL_CASH = 0; // Dump all cash!
               score += (corpData.stockPrice / 100); // Prioritize expensive stocks for max liquidation
           }
        }
        
        if (this.features.stockStarvation) {
            if (isGuaranteedFirst && corpData.isSafe) {
                // If we have excess cash, buy it just to deny supply to others!
                if (currentPlayer.money > 3000) {
                   score += 50; // overriding the -150 penalty
                }
            }
        }

        if (remainingCash < IDEAL_CASH) {
          score -= (IDEAL_CASH - remainingCash) / 50; 
        }
        
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
