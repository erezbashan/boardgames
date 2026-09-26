import { DominionState } from '../engine/types';
import { PlayerAction } from '../engine/actions';
import { getCardDef } from '../engine/cards';

export function getRandomBotAction(state: DominionState, playerId: string): PlayerAction | null {
  const isInputPhase = state.pendingActions.length > 0 && state.pendingActions[0].type === 'REQUEST_INPUT';
  
  if (isInputPhase) {
    const req = state.pendingActions[0];
    if (req.playerId !== playerId) return null;
    
    // Check if the card itself defined a bot choice!
    // We don't track which card asked for it in the payload right now easily unless we pass it.
    // For now, if it's CELLAR discard, let's just discard random cards.
    if (req.type === 'REQUEST_INPUT' && req.inputType === 'DISCARD_FOR_CELLAR') {
       const hand = state.players[playerId].hand;
       // Discard 0 to hand.length cards randomly
       const numToDiscard = Math.floor(Math.random() * (hand.length + 1));
       const shuffledHand = [...hand].sort(() => 0.5 - Math.random());
       const discardedIds = shuffledHand.slice(0, numToDiscard).map(c => c.id);
       
       return { type: 'RESOLVE_INPUT', playerId, payload: { discardedIds } };
    }
  }

  // Not input phase
  if (state.playerOrder[state.currentPlayerIndex] !== playerId) return null;

  const me = state.players[playerId];

  if (state.phase === 'ACTION') {
    const playableActions = me.hand.filter(c => getCardDef(c.cardId).types.includes('ACTION'));
    if (me.actions > 0 && playableActions.length > 0) {
      // Pick random action
      const card = playableActions[Math.floor(Math.random() * playableActions.length)];
      return { type: 'PLAY_CARD', playerId, instanceId: card.id };
    }
    // Else end phase
    return { type: 'END_PHASE', playerId };
  }

  if (state.phase === 'BUY') {
    // 1. Play all treasures (Greedy, no reason not to in base game)
    const playableTreasures = me.hand.filter(c => getCardDef(c.cardId).types.includes('TREASURE'));
    if (playableTreasures.length > 0) {
      return { type: 'PLAY_CARD', playerId, instanceId: playableTreasures[0].id };
    }

    // 2. Buy cards if we have buys
    if (me.buys > 0) {
      const affordable = Object.keys(state.supply).filter(cardId => 
        state.supply[cardId] > 0 && getCardDef(cardId).cost <= me.coins
      );
      if (affordable.length > 0) {
        // Buy random affordable card
        const randomCard = affordable[Math.floor(Math.random() * affordable.length)];
        return { type: 'BUY_CARD', playerId, cardId: randomCard };
      }
    }
    
    // Else end phase
    return { type: 'END_PHASE', playerId };
  }

  return null;
}
