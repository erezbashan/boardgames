import { calculatePayment } from '../reducer';
import { SplendorGameState, SplendorPlayer, SplendorAction, Card, BaseGemTypes, GemType, GemInventory } from '../types';
import { Bot } from './Bot';

function calculateMissingGems(player: SplendorPlayer, card: Card): number {
  let missing = 0;
  let goldAvailable = player.gems.gold;
  const bonuses: any = { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0 };
  for (const c of player.cards) bonuses[c.bonus]++;
  for (const gem of BaseGemTypes) {
    const cost = card.cost[gem] || 0;
    const discounted = Math.max(0, cost - bonuses[gem]);
    if (player.gems[gem] < discounted) {
      const deficit = discounted - player.gems[gem];
      if (goldAvailable >= deficit) goldAvailable -= deficit;
      else {
        missing += (deficit - goldAvailable);
        goldAvailable = 0;
      }
    }
  }
  return missing;
}

export class HeuristicBot implements Bot {
  name = 'heuristic';
  
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
          if (tempGems.gold > 0) { tempGems.gold--; toDiscard.gold = (toDiscard.gold || 0) + 1; count--; }
          break;
        }
        tempGems[available[0]]--;
        toDiscard[available[0]] = (toDiscard[available[0]] || 0) + 1;
        count--;
      }
      return { type: 'DISCARD_GEMS', payload: { gems: toDiscard } } as any;
    }
    if (state.turnState !== 'take_tokens') return null;

    // Determine game phase
    const maxScore = Math.max(...Object.values(state.players).map(p => p.score));
    const isLateGame = maxScore >= 11;
    const isMidGame = maxScore >= 6 && maxScore < 11;

    // Dynamic Weights
    let wPointValue = 15.0;
    let wBonusValue = 8.0;
    let wCostPenalty = 1.0;
    let wDistanceDiscount = 0.6;
    let wNobleSynergy = 6.0;

    if (isLateGame) {
      wPointValue = 40.0;
      wBonusValue = 1.0;
      wCostPenalty = 0.5;
      wDistanceDiscount = 0.5;
      wNobleSynergy = 2.0;
    } else if (isMidGame) {
      wPointValue = 20.0;
      wBonusValue = 6.0;
    }

    const getBonuses = (p: SplendorPlayer) => {
      const b: any = { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0 };
      for (const c of p.cards) b[c.bonus]++;
      return b;
    };

    // Add personality to break identical first turns
    const idHash = playerId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const preferredColor = BaseGemTypes[idHash % 5];

    const opponents = Object.values(state.players).filter(p => p.id !== playerId);

    const evalCard = (p: SplendorPlayer, c: Card) => {
      let v = c.points * wPointValue + wBonusValue;
      if (c.bonus === preferredColor) v += 2.5; // Slight bias towards a specific color to diversify bot strategies
      
      const b = getBonuses(p);
      for (const n of state.nobles) {
        if ((n.requirements[c.bonus] || 0) > b[c.bonus]) v += wNobleSynergy;
      }
      const totalCost = Object.values(c.cost).reduce((a, b) => a + (b || 0), 0);
      let score = v - (totalCost * wCostPenalty);

      // Collision Avoidance: If an opponent is collecting the gems needed for this card, reduce its value.
      for (const opp of opponents) {
         let overlap = 0;
         for (const g of BaseGemTypes) {
           if ((c.cost[g] || 0) > 0 && opp.gems[g] > 0) {
             overlap += Math.min(c.cost[g] || 0, opp.gems[g]);
           }
         }
         score -= overlap * 8.0; // Subtract 8 points for every gem an opponent has collected towards this card

         const oppMissing = calculateMissingGems(opp, c);
         if (oppMissing <= 1) { 
            score -= 50.0; // Massive penalty if they are extremely close
         }
      }
      return score;
    };

    const allBoardCards = [
      ...state.board.tier1.map(c => ({ card: c, tier: 1, loc: 'board' })),
      ...state.board.tier2.map(c => ({ card: c, tier: 2, loc: 'board' })),
      ...state.board.tier3.map(c => ({ card: c, tier: 3, loc: 'board' })),
    ].filter(x => x.card !== null) as any[];
    const allReservedCards = player.reservedCards.map(c => ({ card: c, tier: c.tier, loc: 'reserved' })) as any[];
    const allCards = [...allBoardCards, ...allReservedCards];

    let bestAction: SplendorAction | null = null;
    let bestScore = -Infinity;
    const consider = (action: SplendorAction, score: number) => {
      const noisyScore = score + (Math.random() * 0.001);
      if (noisyScore > bestScore) { bestScore = noisyScore; bestAction = action; }
    };

    // 1. Buy cards
    for (const item of allCards) {
      if (calculatePayment(player, item.card) !== null) {
        let action = item.loc === 'reserved' 
          ? { type: 'PURCHASE_RESERVED_CARD', payload: { cardId: item.card.id } }
          : { type: 'PURCHASE_CARD_BOARD', payload: { tier: item.tier, cardId: item.card.id } };
        consider(action as any, evalCard(player, item.card) + 200); 
      }
    }

    // 2. Reserve cards
    if (player.reservedCards.length < 3) {
      const opponents = Object.values(state.players).filter(p => p.id !== playerId);
      for (const item of allBoardCards) {
        const missing = calculateMissingGems(player, item.card);
        const baseVal = evalCard(player, item.card);
        let reserveScore = (baseVal * Math.pow(wDistanceDiscount, missing)) + (state.bank.gold > 0 ? 5.0 : 0);
        
        // Denial logic: massive boost if opponent is very close to a high point card
        for (const opp of opponents) {
           const oppMissing = calculateMissingGems(opp, item.card);
           if (oppMissing <= 1 && item.card.points >= 3) {
              reserveScore += (item.card.points * 10); 
           }
        }
        
        consider({ type: 'RESERVE_CARD_BOARD', payload: { tier: item.tier, cardId: item.card.id } } as any, reserveScore - 5);
      }
    }

    // 3. Take gems
    const totalGems = Object.values(player.gems).reduce((a, b) => a + b, 0);
    if (totalGems < 10) {
      const targets = allCards.map(item => ({
        ...item, 
        missing: calculateMissingGems(player, item.card), 
        score: evalCard(player, item.card) * Math.pow(wDistanceDiscount, calculateMissingGems(player, item.card))
      })).sort((a, b) => b.score - a.score).slice(0, 3);

      const availableTypes = BaseGemTypes.filter(g => state.bank[g] > 0);
      const validTakes: Partial<GemInventory>[] = [];
      for (const g of BaseGemTypes) if (state.bank[g] >= 4) validTakes.push({ [g]: 2 });
      
      const numToTake = Math.min(3, availableTypes.length);
      if (numToTake > 0) {
        const getCombs = (arr: GemType[], k: number): GemType[][] => {
          if (k === 1) return arr.map(x => [x]);
          const result: GemType[][] = [];
          for (let i = 0; i <= arr.length - k; i++) {
            const tailCombs = getCombs(arr.slice(i + 1), k - 1);
            tailCombs.forEach(tc => result.push([arr[i], ...tc]));
          }
          return result;
        };
        getCombs(availableTypes, numToTake).forEach(comb => {
          const take: any = {}; comb.forEach(g => take[g] = 1); validTakes.push(take);
        });
      }

      for (const take of validTakes) {
        let takeScore = 0;
        const simPlayer = { ...player, gems: { ...player.gems } };
        for (const [g, amt] of Object.entries(take)) simPlayer.gems[g as GemType] += (amt as number);

        for (const target of targets) {
          const delta = target.missing - calculateMissingGems(simPlayer, target.card);
          if (delta > 0) takeScore += target.score * 0.6 * delta;
        }

        const gemsTaken = Object.values(take).reduce((a: any, b: any) => a + (b || 0), 0);
        takeScore += (gemsTaken as number) * 1.5; 
        if (totalGems + (gemsTaken as number) > 10) takeScore -= 30;

        consider({ type: 'TAKE_GEMS', payload: { gems: take } } as any, takeScore);
      }
    }

    return bestAction;
  }
}
