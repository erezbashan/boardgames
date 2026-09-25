import { SplendorGameState, SplendorAction, SplendorPlayer, BaseGemTypes, GemType, GemInventory, Card } from '../types';
import { calculatePayment } from '../reducer';
import { Bot } from './Bot';

export interface BotWeights {
  pointValue: number;          // Multiplier for prestige points
  bonusValue: number;          // Multiplier for getting a permanent gem bonus
  nobleSynergy: number;        // Value for a bonus gem that matches an available noble requirement
  goldValue: number;           // Value of taking a gold token (when reserving)
  tokenValue: number;          // Value of taking a regular token
  costPenalty: number;         // Negative weight applied to the total cost of a card
  distanceDiscount: number;    // Multiplier (e.g., 0.7) to discount target value based on missing gems
  denialValue: number;         // (Optional) Value of taking a card that helps opponents
}

export const defaultWeights: BotWeights = {
  pointValue: 15.0,
  bonusValue: 8.0,
  nobleSynergy: 5.0,
  goldValue: 4.0,
  tokenValue: 1.0,
  costPenalty: 1.0,
  distanceDiscount: 0.6,
  denialValue: 0.0
};

// Helper: Calculate how many gems a player is missing to buy a card
function calculateMissingGems(player: SplendorPlayer, card: Card): number {
  let missing = 0;
  let goldAvailable = player.gems.gold;
  
  const bonuses = getPlayerBonuses(player);
  
  for (const gem of BaseGemTypes) {
    const cost = card.cost[gem] || 0;
    const discountedCost = Math.max(0, cost - bonuses[gem]);
    
    if (player.gems[gem] < discountedCost) {
      const deficit = discountedCost - player.gems[gem];
      if (goldAvailable >= deficit) {
        goldAvailable -= deficit;
      } else {
        const trueDeficit = deficit - goldAvailable;
        goldAvailable = 0;
        missing += trueDeficit;
      }
    }
  }
  return missing;
}

function getPlayerBonuses(player: SplendorPlayer): Record<string, number> {
  const bonuses: Record<string, number> = { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0 };
  for (const card of player.cards) {
    bonuses[card.bonus]++;
  }
  return bonuses;
}

// Evaluate how good a card is for the player based on points, bonus, and nobles
function evaluateCardBaseValue(state: SplendorGameState, player: SplendorPlayer, card: Card, weights: BotWeights): number {
  let value = 0;
  
  // 1. Points
  value += card.points * weights.pointValue;
  
  // 2. Bonus value
  value += weights.bonusValue;
  
  // 3. Noble synergy
  const bonuses = getPlayerBonuses(player);
  for (const noble of state.nobles) {
    const req = noble.requirements[card.bonus] || 0;
    if (req > bonuses[card.bonus]) {
      value += weights.nobleSynergy;
    }
  }
  
  // 4. Cost penalty
  const totalCost = Object.values(card.cost).reduce((a, b) => a + (b || 0), 0);
  value -= totalCost * weights.costPenalty;
  
  return value;
}

export class HeuristicBot implements Bot {
  name = 'heuristic';
  weights: BotWeights;

  constructor(weights: BotWeights = defaultWeights) {
    this.weights = weights;
  }

  takeTurn(state: SplendorGameState, playerId: string): SplendorAction | null {
    const player = state.players[playerId];
    if (!player) return null;

    if (state.turnState === 'choose_noble') {
      const bestNoble = [...state.eligibleNoblesForCurrentPlayer].sort((a, b) => b.points - a.points)[0];
      return { type: 'CHOOSE_NOBLE', payload: { nobleId: bestNoble.id } } as any;
    }

    if (state.turnState === 'discard_tokens') {
      const toDiscard: Partial<GemInventory> = {};
      let count = state.pendingDiscardCount;
      const tempGems = { ...player.gems };
      
      while (count > 0) {
        const available = BaseGemTypes.filter(g => tempGems[g] > 0).sort((a, b) => tempGems[b] - tempGems[a]);
        if (available.length === 0) {
          if (tempGems.gold > 0) {
            tempGems.gold--;
            toDiscard.gold = (toDiscard.gold || 0) + 1;
            count--;
          }
          break;
        }
        const g = available[0];
        tempGems[g]--;
        toDiscard[g] = (toDiscard[g] || 0) + 1;
        count--;
      }
      return { type: 'DISCARD_GEMS', payload: { gems: toDiscard } } as any;
    }

    if (state.turnState !== 'take_tokens') return null;

    const allBoardCards = [
      ...state.board.tier1.map(c => ({ card: c, tier: 1, loc: 'board' })),
      ...state.board.tier2.map(c => ({ card: c, tier: 2, loc: 'board' })),
      ...state.board.tier3.map(c => ({ card: c, tier: 3, loc: 'board' })),
    ].filter(x => x.card !== null) as { card: Card, tier: 1|2|3, loc: 'board' }[];
    
    const allReservedCards = player.reservedCards.map(c => ({ card: c, tier: c.tier, loc: 'reserved' })) as { card: Card, tier: 1|2|3, loc: 'reserved' }[];
    
    const allCards = [...allBoardCards, ...allReservedCards];

    let bestAction: SplendorAction | null = null;
    let bestScore = -Infinity;

    const considerAction = (action: SplendorAction, score: number) => {
      const noisyScore = score + (Math.random() * 0.001);
      if (noisyScore > bestScore) {
        bestScore = noisyScore;
        bestAction = action;
      }
    };

    for (const item of allCards) {
      if (calculatePayment(player, item.card) !== null) {
        const baseVal = evaluateCardBaseValue(state, player, item.card, this.weights);
        const buyScore = baseVal;
        
        let action: SplendorAction;
        if (item.loc === 'reserved') {
          action = { type: 'PURCHASE_RESERVED_CARD', payload: { cardId: item.card.id } } as any;
        } else {
          action = { type: 'PURCHASE_CARD_BOARD', payload: { tier: item.tier, cardId: item.card.id } } as any;
        }
        
        considerAction(action, buyScore + 100); 
      }
    }

    if (player.reservedCards.length < 3) {
      for (const item of allBoardCards) {
        const missing = calculateMissingGems(player, item.card);
        const baseVal = evaluateCardBaseValue(state, player, item.card, this.weights);
        const getsGold = state.bank.gold > 0;
        const reserveScore = (baseVal * Math.pow(this.weights.distanceDiscount, missing)) + (getsGold ? this.weights.goldValue : 0);
        const action = { type: 'RESERVE_CARD_BOARD', payload: { tier: item.tier, cardId: item.card.id } } as any;
        considerAction(action, reserveScore - 10); 
      }
    }

    const totalGems = Object.values(player.gems).reduce((a, b) => a + b, 0);
    if (totalGems < 10) {
      const targets = allCards.map(item => {
        const missing = calculateMissingGems(player, item.card);
        const baseVal = evaluateCardBaseValue(state, player, item.card, this.weights);
        const score = baseVal * Math.pow(this.weights.distanceDiscount, missing);
        return { ...item, missing, score };
      }).sort((a, b) => b.score - a.score);
      
      const topTargets = targets.slice(0, 3);
      const availableTypes = BaseGemTypes.filter(g => state.bank[g] > 0);
      const validTakes: Partial<GemInventory>[] = [];

      for (const g of BaseGemTypes) {
        if (state.bank[g] >= 4) {
          validTakes.push({ [g]: 2 });
        }
      }

      const numToTake = Math.min(3, availableTypes.length);
      if (numToTake > 0) {
        const getCombinations = (arr: GemType[], k: number): GemType[][] => {
          if (k === 1) return arr.map(x => [x]);
          const result: GemType[][] = [];
          for (let i = 0; i <= arr.length - k; i++) {
            const head = arr[i];
            const tailCombs = getCombinations(arr.slice(i + 1), k - 1);
            tailCombs.forEach(tc => result.push([head, ...tc]));
          }
          return result;
        };
        
        const combs = getCombinations(availableTypes, numToTake);
        for (const comb of combs) {
          const take: Partial<GemInventory> = {};
          comb.forEach(g => take[g] = 1);
          validTakes.push(take);
        }
      }

      for (const take of validTakes) {
        let takeScore = 0;
        const simulatedPlayer = { ...player, gems: { ...player.gems } };
        for (const [g, amt] of Object.entries(take)) {
           simulatedPlayer.gems[g as GemType] += (amt as number);
        }

        for (const target of topTargets) {
          const newMissing = calculateMissingGems(simulatedPlayer, target.card);
          const missingDelta = target.missing - newMissing;
          if (missingDelta > 0) {
             takeScore += target.score * 0.5 * missingDelta; 
          }
        }

        const gemsTaken = Object.values(take).reduce((a, b) => a + (b || 0), 0);
        takeScore += gemsTaken * this.weights.tokenValue;

        if (totalGems + gemsTaken > 10) {
           takeScore -= 20; 
        }

        const action = { type: 'TAKE_GEMS', payload: { gems: take } } as any;
        considerAction(action, takeScore);
      }
    }

    return bestAction;
  }
}
