import { DominionState } from '../engine/types';
import { PlayerAction } from '../engine/actions';
import { getCardDef } from '../engine/cards';
function calculateGameProgress(state: DominionState): number {
    const numPlayers = state.playerOrder.length;
    const lookback = 2 * numPlayers;
    const recent = state.recentBuyingPowers || [];
    const window = recent.slice(-lookback);
    while (window.length < lookback) window.unshift(0);
    let provincesBoughtCount = 0;
    let otherCardsBoughtCount = 0;
    for (const bp of window) {
       if (bp >= 8) provincesBoughtCount++;
       if (bp >= 3 && bp < 8) otherCardsBoughtCount++;
    }
    const provinceRatePerRound = Math.max(0.1, provincesBoughtCount / 2);
    const provincesLeft = state.supply['province'] ?? 8;
    const roundsToDepleteProvinces = provincesLeft / provinceRatePerRound;
    const cardsToEmpty3Piles = 30;
    const otherCardsRatePerRound = Math.max(0.5, otherCardsBoughtCount / 2);
    const roundsToEmptyPiles = (cardsToEmpty3Piles * 2) / otherCardsRatePerRound;
    const estimatedRoundsLeft = Math.min(roundsToDepleteProvinces, roundsToEmptyPiles);
    return Math.max(0, Math.min(1, 1 - (estimatedRoundsLeft / 15)));
}

function getEndGameModifier(state: DominionState, playerId: string, cardId: string) {
    let emptyPiles = 0;
    for (const id in state.supply) {
        if (state.supply[id] <= 0) emptyPiles++;
    }
    
    const emptiesProvince = (cardId === 'province' && state.supply['province'] === 1);
    const emptiesThirdPile = (state.supply[cardId] === 1 && emptyPiles === 2);
    
    if (emptiesProvince || emptiesThirdPile) {
        const me = state.players[playerId];
        const def = getCardDef(cardId);
        const isVP = def.types.includes('VICTORY');
        const vpGain = isVP ? (cardId === 'province' ? 6 : cardId === 'duchy' ? 3 : cardId === 'estate' ? 1 : (cardId === 'gardens' ? Math.floor((me.deck.length + me.discard.length + me.hand.length + me.playArea.length + 1) / 10) : 0)) : 0;
        const newMeVP = me.victoryPoints + vpGain;
        
        let isAhead = true;
        for (const pId in state.players) {
            if (pId === playerId) continue;
            if (state.players[pId].victoryPoints >= newMeVP) {
                isAhead = false;
                break;
            }
        }
        return isAhead ? 1000 : -1000;
    }
    return 0;
}


export function getRandomBotAction(state: DominionState, playerId: string): PlayerAction | null {
  const isInputPhase = state.pendingActions.length > 0 && state.pendingActions[0].type === 'REQUEST_INPUT';
  
  if (isInputPhase) {
    const inputReq = state.pendingActions[0] as { type: 'REQUEST_INPUT'; playerId: string; inputType: string; payload?: any };
    if (inputReq.playerId !== playerId) return null;
    
    if (inputReq.inputType === 'DISCARD_FOR_CELLAR') {
      const hand = state.players[playerId].hand;
      // Smart: discard victory cards and curses (useless in hand), keep treasures & actions
      const toDiscard = hand
        .filter(c => {
          const def = getCardDef(c.cardId);
          return def.types.includes('VICTORY') || c.cardId === 'curse';
        })
        .map(c => c.id);
      return { type: 'RESOLVE_INPUT', playerId, payload: { discardedIds: toDiscard } };
    }

    if (inputReq.inputType === 'DISCARD_FOR_MILITIA' || inputReq.inputType === 'DISCARD_FOR_POACHER') {
      const hand = [...state.players[playerId].hand];
      // Sort hand by least valuable first
      hand.sort((a, b) => {
        const valA = getCardDef(a.cardId).types.includes('VICTORY') || a.cardId === 'curse' ? 0 : getCardDef(a.cardId).cost;
        const valB = getCardDef(b.cardId).types.includes('VICTORY') || b.cardId === 'curse' ? 0 : getCardDef(b.cardId).cost;
        return valA - valB;
      });
      const amount = inputReq.payload?.amount || 0;
      const toDiscard = hand.slice(0, amount).map(c => c.id);
      return { type: 'RESOLVE_INPUT', playerId, payload: { discardedIds: toDiscard } };
    }

    if (inputReq.inputType === 'TRASH_FOR_CHAPEL') {
      const chapelDef = getCardDef('chapel');
      if (chapelDef.botChoose) {
        const result = chapelDef.botChoose(state, { playerId });
        return { type: 'RESOLVE_INPUT', playerId, payload: result };
      }
      return { type: 'RESOLVE_INPUT', playerId, payload: { trashedIds: [] } };
    }

    if (inputReq.inputType === 'PLAY_FOR_THRONE_ROOM') {
      const throneDef = getCardDef('throne_room');
      if (throneDef.botChoose) {
        const result = throneDef.botChoose(state, { playerId });
        return { type: 'RESOLVE_INPUT', playerId, payload: result };
      }
      return { type: 'RESOLVE_INPUT', playerId, payload: { instanceId: '' } };
    }

    if (inputReq.inputType === 'GAIN_CARD') {
      const maxCost = inputReq.payload?.maxCost || 99;
      const affordable = Object.keys(state.supply).filter(id => state.supply[id] > 0 && getCardDef(id).cost <= maxCost);
      if (affordable.length > 0) {
         let bestScore = -9999;
         let bestCard = '';
         const prog = calculateGameProgress(state);
         const playerCount = Object.keys(state.players).length;
         let defaultParams = { vpIntercept: 0, vpSlope: 15, moneyIntercept: 1, moneySlope: 0, actionIntercept: 0.5, actionSlope: 0 }; // 1v1 Default
         if (playerCount === 3) defaultParams = { vpIntercept: -20, vpSlope: 45, moneyIntercept: 1, moneySlope: 0, actionIntercept: 0.5, actionSlope: 0 };
         else if (playerCount === 4) defaultParams = { vpIntercept: -30, vpSlope: 60, moneyIntercept: 1, moneySlope: 0, actionIntercept: 0.5, actionSlope: 0 };
         else if (playerCount === 5) defaultParams = { vpIntercept: -40, vpSlope: 75, moneyIntercept: 1, moneySlope: 0, actionIntercept: 0.5, actionSlope: 0 };
         else if (playerCount >= 6) defaultParams = { vpIntercept: -50, vpSlope: 90, moneyIntercept: 1, moneySlope: 0, actionIntercept: 0.5, actionSlope: 0 };
         const params = state.settings?.botParams?.[playerId] || state.settings?.botParams || { ...defaultParams, strategy: 'V2' };
         const scoreCard = (id: string) => {
            const def = getCardDef(id);
            let val = def.cost;
            if (def.types.includes('VICTORY')) {
               val += params.vpIntercept + (params.vpSlope * prog);
            } else if (def.types.includes('TREASURE')) {
               val += params.moneyIntercept + (params.moneySlope * prog);
            } else if (def.types.includes('ACTION')) {
               val += params.actionIntercept + (params.actionSlope * prog);
            }
            val += getEndGameModifier(state, playerId, id);
            
            if (val > bestScore) {
               bestScore = val;
               bestCard = id;
            }
         };
         affordable.forEach(scoreCard);
         if (bestCard) {
            return { type: 'RESOLVE_INPUT', playerId, payload: { cardId: bestCard } };
         }
      }
      return { type: 'RESOLVE_INPUT', playerId, payload: { cardId: '' } };
    }

    if (inputReq.inputType === 'HAND_TO_DECK') {
      const p = state.players[playerId];
      const isBureaucrat = inputReq.payload?.filterTypes?.includes('VICTORY');
      if (isBureaucrat) {
        // Bureaucrat: put cheapest Victory card
        const vCards = p.hand.filter(c => getCardDef(c.cardId).types.includes('VICTORY'));
        const cheapest = vCards.sort((a, b) => getCardDef(a.cardId).cost - getCardDef(b.cardId).cost)[0];
        if (cheapest) return { type: 'RESOLVE_INPUT', playerId, payload: { instanceId: cheapest.id } };
      } else {
        // Artisan: if no actions left, put best action on top. Else cheapest card.
        if (p.actions === 0) {
          const actionCards = p.hand.filter(c => getCardDef(c.cardId).types.includes('ACTION'));
          const bestAction = actionCards.sort((a, b) => getCardDef(b.cardId).cost - getCardDef(a.cardId).cost)[0];
          if (bestAction) return { type: 'RESOLVE_INPUT', playerId, payload: { instanceId: bestAction.id } };
        }
        const cheapestCard = [...p.hand].sort((a, b) => getCardDef(a.cardId).cost - getCardDef(b.cardId).cost)[0];
        if (cheapestCard) return { type: 'RESOLVE_INPUT', playerId, payload: { instanceId: cheapestCard.id } };
      }
      return { type: 'RESOLVE_INPUT', playerId, payload: { cardId: '' } };
    }




    if (inputReq.inputType === 'DISCARD_TO_DECK') {
      const p = state.players[playerId];
      const allCards = [...p.deck, ...p.discard, ...p.hand, ...p.playArea];
      const costs = allCards.map(c => getCardDef(c.cardId).cost).sort((a, b) => a - b);
      const medianCost = costs[Math.floor(costs.length / 2)] || 0;
      
      const bestInDiscard = [...p.discard].sort((a, b) => getCardDef(b.cardId).cost - getCardDef(a.cardId).cost)[0];
      if (bestInDiscard && getCardDef(bestInDiscard.cardId).cost > medianCost) {
        return { type: 'RESOLVE_INPUT', playerId, payload: { instanceId: bestInDiscard.id } };
      }
      return { type: 'RESOLVE_INPUT', playerId, payload: { instanceId: '' } };
    }

    if (inputReq.inputType === 'PLAY_VASSAL_ACTION') {
      return { type: 'RESOLVE_INPUT', playerId, payload: { playCard: true } };
    }

    if (inputReq.inputType === 'LIBRARY_KEEP') {
      const me = state.players[playerId];
      const cardId = inputReq.payload?.card?.cardId;
      if (getCardDef(cardId).types.includes('ACTION') && me.actions === 0) {
        return { type: 'RESOLVE_INPUT', playerId, payload: { keep: false } }; // Discard it since we have no actions
      }
      return { type: 'RESOLVE_INPUT', playerId, payload: { keep: true } };
    }

    if (inputReq.inputType === 'SENTRY_CHOICE') {
      const cards = inputReq.payload?.cards || [];
      const trashIds: string[] = [];
      const discardIds: string[] = [];
      const deckIds: string[] = [];
      for (const c of cards) {
        const def = getCardDef(c.cardId);
        if (c.cardId === 'curse' || c.cardId === 'estate' || c.cardId === 'copper') {
          trashIds.push(c.id);
        } else if (def.types.includes('VICTORY')) {
          discardIds.push(c.id);
        } else {
          deckIds.push(c.id);
        }
      }
      return { type: 'RESOLVE_INPUT', playerId, payload: { trashIds, discardIds, deckIds } };
    }
    
    if (inputReq.inputType === 'TRASH_FOR_REMODEL') {
      const me = state.players[playerId];
      if (me.hand.length === 0) return { type: 'RESOLVE_INPUT', playerId, payload: { trashedIds: [] } };
      
      const curse = me.hand.find(c => c.cardId === 'curse');
      if (curse) return { type: 'RESOLVE_INPUT', playerId, payload: { trashedIds: [curse.id] } };
      
      const emptyPiles = Object.values(state.supply).filter(c => c === 0).length;
      const isLateGame = state.supply['province'] <= 4 || emptyPiles >= 2;
      
      if (!isLateGame) {
         const estate = me.hand.find(c => c.cardId === 'estate');
         if (estate) return { type: 'RESOLVE_INPUT', playerId, payload: { trashedIds: [estate.id] } };
      }
      
      // Avoid trashing ANY victory cards if possible
      const nonVP = me.hand.filter(c => {
         const types = getCardDef(c.cardId).types;
         return !types.includes('VICTORY') && c.cardId !== 'curse';
      });
      
      const handToConsider = nonVP.length > 0 ? nonVP : me.hand;
      
      // Look for a card we can exactly upgrade by 2
      for (const c of handToConsider) {
        const def = getCardDef(c.cardId);
        const targetCost = def.cost + 2;
        const availableInSupply = Object.keys(state.supply).find(s => getCardDef(s).cost === targetCost && state.supply[s] > 0);
        if (availableInSupply) {
          return { type: 'RESOLVE_INPUT', playerId, payload: { trashedIds: [c.id] } };
        }
      }
      
      // If we must trash, trash the cheapest card (often copper)
      const sortedHand = [...handToConsider].sort((a, b) => getCardDef(a.cardId).cost - getCardDef(b.cardId).cost);
      return { type: 'RESOLVE_INPUT', playerId, payload: { trashedIds: [sortedHand[0].id] } };
    }
    
    if (inputReq.inputType === 'TRASH_FOR_MINE') {
      const me = state.players[playerId];
      const silver = me.hand.find(c => c.cardId === 'silver');
      if (silver) return { type: 'RESOLVE_INPUT', playerId, payload: { trashedIds: [silver.id] } };
      const copper = me.hand.find(c => c.cardId === 'copper');
      if (copper) return { type: 'RESOLVE_INPUT', playerId, payload: { trashedIds: [copper.id] } };
      return { type: 'RESOLVE_INPUT', playerId, payload: { trashedIds: [] } };
    }
  }

  // Not input phase
  if (state.playerOrder[state.currentPlayerIndex] !== playerId) return null;

  const me = state.players[playerId];

  if (state.phase === 'ACTION') {
    let playableActions = me.hand.filter(c => getCardDef(c.cardId).types.includes('ACTION'));

      // SAFETY FILTER: Don't play an action that forces a game over if we are losing!
      playableActions = playableActions.filter(c => {
         let emptiesPile = false;
         if (c.cardId === 'witch') {
             const opponents = Object.keys(state.players).length - 1;
             if (state.supply['curse'] <= opponents) emptiesPile = true;
         } else if (c.cardId === 'bureaucrat') {
             if (state.supply['silver'] === 1) emptiesPile = true;
         }
         
         if (emptiesPile) {
            let emptyPiles = 0;
            for (const id in state.supply) if (state.supply[id] <= 0) emptyPiles++;
            // If playing this empties the 3rd pile
            if (emptyPiles >= 2) {
                let isAhead = true;
                for (const pId in state.players) {
                    if (pId === playerId) continue;
                    // If anyone is beating or tying us, don't end the game!
                    if (state.players[pId].victoryPoints >= me.victoryPoints) {
                        isAhead = false;
                        break;
                    }
                }
                if (!isAhead) return false; // DON'T PLAY IT
            }
         }
         return true;
      });
    
    if (me.actions > 0 && playableActions.length > 0) {
      // Throne Room logic
      const throneRoom = playableActions.find(c => c.cardId === 'throne_room');
      if (throneRoom && playableActions.length > 1) {
        return { type: 'PLAY_CARD', playerId, instanceId: throneRoom.id };
      }
      
      // Exclude Throne Room from normal choices to prefer playing it first
      playableActions = playableActions.filter(c => c.cardId !== 'throne_room');
      
      const getActionPriority = (c: any) => {
        const def = getCardDef(c.cardId);
        const desc = def.description.toLowerCase();
        
        // Priority 1: +2 Actions (Village, Festival, etc)
        if (desc.includes('+2 actions')) return 1;
        
        // Priority 2: +1 Action AND +Card (Lab, Market, etc)
        if (desc.includes('+1 action') && desc.includes('+') && desc.includes('card')) return 2;
        
        // Priority 3: +1 Action only
        if (desc.includes('+1 action')) return 3;
        
        // Terminal cards (No actions given)
        // Priority 4: Terminal Draw (Smithy, Witch, Council Room, Library)
        if (desc.includes('+') && desc.includes('card')) return 4;
        
        // Priority 5: Terminal Payload / Other (Militia, Remodel, Chapel, etc)
        return 5;
      };

      // Always play Chapel first if we have junk to trash
      const hasJunk = me.hand.some(c => c.cardId === 'curse' || c.cardId === 'estate');
      if (hasJunk) {
        const chapel = playableActions.find(c => c.cardId === 'chapel');
        if (chapel) {
          return { type: 'PLAY_CARD', playerId, instanceId: chapel.id };
        }
      }

      playableActions.sort((a, b) => getActionPriority(a) - getActionPriority(b));

      if (playableActions.length > 0) {
        return { type: 'PLAY_CARD', playerId, instanceId: playableActions[0].id };
      }
    }
    return { type: 'END_PHASE', playerId };
  }

  if (state.phase === 'BUY') {
    // 1. Play all treasures (always beneficial)
    const playableTreasures = me.hand.filter(c => getCardDef(c.cardId).types.includes('TREASURE'));
    if (playableTreasures.length > 0) {
      // Play most valuable treasure first
      const sorted = [...playableTreasures].sort((a, b) =>
        getCardDef(b.cardId).cost - getCardDef(a.cardId).cost
      );
      return { type: 'PLAY_CARD', playerId, instanceId: sorted[0].id };
    }

    // 2. Buy if we have buys remaining
    if (me.buys > 0) {
      // Filter to affordable cards that don't give negative VP
      const affordable = Object.keys(state.supply).filter(cardId => {
        if (state.supply[cardId] <= 0) return false;
        const def = getCardDef(cardId);
        if (def.cost > me.coins) return false;
        // Never buy curses (negative VP) or coppers (junk)
        if (cardId === 'curse' || cardId === 'copper') return false;
        return true;
      });

      if (affordable.length > 0) {
        // Evaluate the priority of cards based on cost, with some heuristics
        const deckSize = state.players[playerId].deck.length + state.players[playerId].discard.length + state.players[playerId].hand.length + state.players[playerId].playArea.length;
        // Calculate game progress (0.0 to 1.0) using historical buying power
        const numPlayers = state.playerOrder.length;
        const lookback = 2 * numPlayers;
        const recent = state.recentBuyingPowers || [];
        const window = recent.slice(-lookback);
        while (window.length < lookback) window.unshift(0); // Pad with 0 for start of game
        
        let provincesBoughtCount = 0;
        let otherCardsBoughtCount = 0;
        for (const bp of window) {
           if (bp >= 8) provincesBoughtCount++;
           if (bp >= 3 && bp < 8) otherCardsBoughtCount++; // Rough estimate of buying other cards
        }
        
        // Province depletion guess
        const provinceRatePerRound = Math.max(0.1, provincesBoughtCount / 2);
        const provincesLeft = state.supply['province'] ?? 8;
        const roundsToDepleteProvinces = provincesLeft / provinceRatePerRound;
        
        // 3 piles depletion guess
        let emptyPiles = 0;
        const pileDepletions: number[] = [];
        for (const cardId in state.supply) {
           const count = state.supply[cardId];
           if (count === 0) emptyPiles++;
           else if (cardId !== 'province') pileDepletions.push(count);
        }
        pileDepletions.sort((a,b) => a - b);
        
        let cardsToEmpty3Piles = 0;
        const pilesNeeded = Math.max(0, 3 - emptyPiles);
        for (let i = 0; i < pilesNeeded; i++) {
           if (i < pileDepletions.length) cardsToEmpty3Piles += pileDepletions[i];
        }
        const otherCardsRatePerRound = Math.max(0.5, otherCardsBoughtCount / 2);
        const roundsToEmptyPiles = (cardsToEmpty3Piles * 2) / otherCardsRatePerRound;
        
        const estimatedRoundsLeft = Math.min(roundsToDepleteProvinces, roundsToEmptyPiles);
        
        // Map rounds left to 0.0 -> 1.0 (assuming ~15 rounds is a full game)
        const gameProgress = Math.max(0, Math.min(1, 1 - (estimatedRoundsLeft / 15)));

        
        const evaluate = (cardId: string) => {
           // 500-Match Genetic Algorithm Learned Parameters (2-Player Optimized)
           let defaultParams: any = { 
               strategy: 'V2', // Reverted from GA_V3 to V2 to prevent degenerate Duchy Rush
               cardWeights: { sentry: 5, witch: 4, vassal: 4, cellar: 3, chapel: 3, library: 3, council_room: 2, moat: 2, throne_room: 2, poacher: 2, village: 1, merchant: 1, workshop: 0, festival: 0, gardens: -1, remodel: -1, mine: -1, bureaucrat: -3, market: -2, laboratory: 0, harbinger: -3, militia: -3, moneylender: -3, artisan: -5, bandit: -5, smithy: -5 }
           }; 
           const playerCount = Object.keys(state.players).length;
           // As per request, apply this 2-player optimized profile to all player counts 
           // until we run separate simulations for 3,4,5,6 players.
           const params = state.settings?.botParams?.[playerId] || state.settings?.botParams || defaultParams;
           
           const def = getCardDef(cardId);
           let val = def.cost;
           
           // Apply learned card-specific weights if provided
           if (params.cardWeights && params.cardWeights[cardId]) {
               val += params.cardWeights[cardId];
           }
           const isVP = def.types.includes('VICTORY');
           const isTreasure = def.types.includes('TREASURE');
           
           const provincesLeft = state.supply['province'] ?? 8;
           
           // Genetic Algorithm (V3)
           if (params.strategy === 'GA_V3' && params.linear) {
               if (cardId === 'province') val += params.linear.provInt + params.linear.provSlp * gameProgress;
               else if (cardId === 'duchy') val += params.linear.duchyInt + params.linear.duchySlp * gameProgress;
               else if (cardId === 'estate') val += params.linear.estInt + params.linear.estSlp * gameProgress;
               else if (cardId === 'gold') val += params.linear.goldInt + params.linear.goldSlp * gameProgress;
               else if (cardId === 'silver') val += params.linear.silvInt + params.linear.silvSlp * gameProgress;
           } else if (params.strategy === 'V2') {
               if (cardId === 'province') {
                   val += 1000;
               } else if (cardId === 'duchy') {
                   if (provincesLeft <= 4) val += 500;
                   else val -= 1000;
               } else if (cardId === 'estate') {
                   if (provincesLeft <= 2) val += 100;
                   else val -= 1000;
               } else if (isVP) {
                   if (provincesLeft <= 5) val += 200;
                   else val -= 1000;
               } else if (isTreasure) {
                   if (cardId === 'gold') val += 200;
                   else if (cardId === 'silver') val += 100;
                   else val += 50;
               } else {
                   const desc = def.description.toLowerCase();
                   if (desc.includes('+2 actions')) val += 80;
                   else if (desc.includes('+') && desc.includes('card')) val += 70;
                   else val += 40;
               }
           } else {
               if (isVP) val += params.vpIntercept + (params.vpSlope * gameProgress);
               else if (isTreasure) val += params.moneyIntercept + (params.moneySlope * gameProgress);
               else val += params.actionIntercept + (params.actionSlope * gameProgress);
           }

           // Special cases
           if (cardId === 'gardens') {
             if (deckSize < 30) val -= 1000; // Gardens is useless in small decks
             else val += (deckSize >= 40 ? 400 : 200);
           }
           
           val += getEndGameModifier(state, playerId, cardId);

           return val;
        };

        const sorted = [...affordable].sort((a, b) => evaluate(b) - evaluate(a));
        
        // Find all cards that tie for the best evaluation score
        const bestEval = evaluate(sorted[0]);
        const bestCards = sorted.filter(c => evaluate(c) === bestEval);
        
        // Pick a random one among the best
        const bestCard = bestCards[Math.floor(Math.random() * bestCards.length)];

        // IMPORTANT: If the best available card evaluates to a massive negative score,
        // it means getEndGameModifier determined that buying ANY of these cards will cause us to lose.
        // Since buying is optional, we should just stop buying!
        if (bestEval < -500) {
          return { type: 'END_PHASE', playerId };
        }
        
        // Don't buy coppers if we can afford something more useful (cost >= 2)
        if (getCardDef(bestCard).cost === 0 && sorted.length > 1) {
          // Try next best option (might just be more 0 cost, but okay)
          const secondBest = sorted.find(c => getCardDef(c).cost > 0);
          if (secondBest && getCardDef(secondBest).cost <= me.coins) {
            return { type: 'BUY_CARD', playerId, cardId: secondBest };
          }
        }
        
        return { type: 'BUY_CARD', playerId, cardId: bestCard };
      }
    }
    
    // Else end phase
    return { type: 'END_PHASE', playerId };
  }

  return null;
}
