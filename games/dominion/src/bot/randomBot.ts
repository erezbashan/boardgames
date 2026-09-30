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
  }

  // Not input phase
  if (state.playerOrder[state.currentPlayerIndex] !== playerId) return null;

  const me = state.players[playerId];

  if (state.phase === 'ACTION') {
    const playableActions = me.hand.filter(c => getCardDef(c.cardId).types.includes('ACTION'));
    if (me.actions > 0 && playableActions.length > 0) {
      // Priority 1: Action cards that give more actions (village, festival, market, lab, etc.)
      const actionGivers = playableActions.filter(c => {
        const def = getCardDef(c.cardId);
        // These cards give +Actions: check description or specific ids known to give actions
        const desc = def.description.toLowerCase();
        return desc.includes('+2 actions') || desc.includes('+1 action');
      });

      // Among action-givers, prefer more expensive cards
      const sortedActionGivers = [...actionGivers].sort((a, b) => 
        getCardDef(b.cardId).cost - getCardDef(a.cardId).cost
      );

      if (sortedActionGivers.length > 0) {
        return { type: 'PLAY_CARD', playerId, instanceId: sortedActionGivers[0].id };
      }

      // Priority 2: Any action card, sorted by cost descending
      const sortedActions = [...playableActions].sort((a, b) =>
        getCardDef(b.cardId).cost - getCardDef(a.cardId).cost
      );
      return { type: 'PLAY_CARD', playerId, instanceId: sortedActions[0].id };
    }
    // Else end phase
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
        // Never buy curses (negative VP)
        if (cardId === 'curse') return false;
        return true;
      });

      if (affordable.length > 0) {
        // Prefer to keep buying if we have coins to spend (don't waste coins on coppers if we can afford something better)
        // Sort by cost descending — buy the most expensive affordable card
        const sorted = [...affordable].sort((a, b) => getCardDef(b).cost - getCardDef(a).cost);
        
        // But: if we have 0 coins remaining after, and buys > 1, skip to preserve buys
        const bestCard = sorted[0];
        const remainingCoins = me.coins - getCardDef(bestCard).cost;
        
        // Don't buy coppers if we can afford something more useful (cost >= 2)
        if (getCardDef(bestCard).cost === 0 && sorted.length > 1) {
          // Try next best option
          const secondBest = sorted[1];
          if (getCardDef(secondBest).cost <= me.coins) {
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
