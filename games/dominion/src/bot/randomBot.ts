import { DominionState } from '../engine/types';
import { PlayerAction } from '../engine/actions';
import { getCardDef } from '../engine/cards';

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
      const workshopDef = getCardDef('workshop');
      if (workshopDef.botChoose) {
        const result = workshopDef.botChoose(state, { playerId });
        return { type: 'RESOLVE_INPUT', playerId, payload: result };
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



    if (inputReq.inputType === 'TRASH_FOR_REMODEL') {
      const def = getCardDef('remodel');
      if (def.botChoose) return { type: 'RESOLVE_INPUT', playerId, payload: def.botChoose(state, { playerId }) };
      return { type: 'RESOLVE_INPUT', playerId, payload: { trashedIds: [] } };
    }

    if (inputReq.inputType === 'TRASH_FOR_MINE') {
      const def = getCardDef('mine');
      if (def.botChoose) return { type: 'RESOLVE_INPUT', playerId, payload: def.botChoose(state, { playerId }) };
      return { type: 'RESOLVE_INPUT', playerId, payload: { trashedIds: [] } };
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
        if (c.cardId === 'curse') {
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
      const curse = me.hand.find(c => c.cardId === 'curse');
      if (curse) return { type: 'RESOLVE_INPUT', playerId, payload: { trashedIds: [curse.id] } };
      
      // Look for a card we can exactly upgrade by 2
      for (const c of me.hand) {
        const def = getCardDef(c.cardId);
        const targetCost = def.cost + 2;
        const availableInSupply = Object.keys(state.supply).find(s => getCardDef(s).cost === targetCost && state.supply[s] > 0);
        if (availableInSupply) {
          return { type: 'RESOLVE_INPUT', playerId, payload: { trashedIds: [c.id] } };
        }
      }
      return { type: 'RESOLVE_INPUT', playerId, payload: { trashedIds: [] } };
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
    
    if (me.actions > 0 && playableActions.length > 0) {
      // Throne Room logic
      const throneRoom = playableActions.find(c => c.cardId === 'throne_room');
      if (throneRoom && playableActions.length > 1) {
        return { type: 'PLAY_CARD', playerId, instanceId: throneRoom.id };
      }
      
      // Exclude Throne Room from normal choices to prefer playing it first
      playableActions = playableActions.filter(c => c.cardId !== 'throne_room');
      
      // Priority 1: Action cards that give more actions (village, festival, market, lab, etc.)
      const actionGivers = playableActions.filter(c => {
        const def = getCardDef(c.cardId);
        const desc = def.description.toLowerCase();
        return desc.includes('+2 actions') || desc.includes('+1 action');
      });

      const sortedActionGivers = [...actionGivers].sort((a, b) => 
        getCardDef(b.cardId).cost - getCardDef(a.cardId).cost
      );

      if (sortedActionGivers.length > 0) {
        return { type: 'PLAY_CARD', playerId, instanceId: sortedActionGivers[0].id };
      }

      const hasJunk = me.hand.some(c => c.cardId === 'curse' || getCardDef(c.cardId).types.includes('VICTORY'));
      if (hasJunk) {
        const trashDiscarder = playableActions.find(c => c.cardId === 'chapel' || c.cardId === 'cellar' || c.cardId === 'sentry');
        if (trashDiscarder) {
          return { type: 'PLAY_CARD', playerId, instanceId: trashDiscarder.id };
        }
      }

      const sortedActions = [...playableActions].sort((a, b) =>
        getCardDef(b.cardId).cost - getCardDef(a.cardId).cost
      );
      if (sortedActions.length > 0) {
        return { type: 'PLAY_CARD', playerId, instanceId: sortedActions[0].id };
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
           const def = getCardDef(cardId);
           let val = def.cost;
           const isVP = def.types.includes('VICTORY');
           const isTreasure = def.types.includes('TREASURE');
           
           // Use linear formulas parameterized for tournaments
           // Default params if none provided in settings
           const params = state.settings?.botParams?.[playerId] || state.settings?.botParams || {
               vpIntercept: -10, vpSlope: 30, // Starts at -10, ends at +20
               moneyIntercept: 1, moneySlope: -2, // Starts at +1, ends at -1
               actionIntercept: 0, actionSlope: 0
           };

           if (isVP) {
               val += params.vpIntercept + (params.vpSlope * gameProgress);
           } else if (isTreasure) {
               val += params.moneyIntercept + (params.moneySlope * gameProgress);
           } else {
               val += params.actionIntercept + (params.actionSlope * gameProgress);
           }

           // Special cases
           if (cardId === 'gardens') {
             if (deckSize < 30) val -= 5;
             else val += (deckSize >= 40 ? 6 : 2);
           }
           
           // End game logic check
           const emptiesProvince = (cardId === 'province' && state.supply['province'] === 1);
           const emptiesThirdPile = (state.supply[cardId] === 1 && emptyPiles === 2);
           
           if (emptiesProvince || emptiesThirdPile) {
               // Calculate approximate VP if we bought this
               const vpGain = isVP ? (cardId === 'province' ? 6 : cardId === 'duchy' ? 3 : cardId === 'estate' ? 1 : 0) : 0;
               const newMeVP = me.victoryPoints + vpGain;
               
               let isAhead = true;
               for (const pId in state.players) {
                  if (pId === playerId) continue;
                  if (state.players[pId].victoryPoints >= newMeVP) {
                     isAhead = false;
                     break;
                  }
               }
               
               if (isAhead) {
                  val += 1000; // MUST END GAME NOW
               } else {
                  val -= 1000; // NEVER END GAME IF LOSING
               }
           }

           return val;
        };

        const sorted = [...affordable].sort((a, b) => evaluate(b) - evaluate(a));
        
        // Find all cards that tie for the best evaluation score
        const bestEval = evaluate(sorted[0]);
        const bestCards = sorted.filter(c => evaluate(c) === bestEval);
        
        // Pick a random one among the best
        const bestCard = bestCards[Math.floor(Math.random() * bestCards.length)];
        
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
