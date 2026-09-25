import { SplendorGameState, SplendorAction, BaseGemTypes, GemInventory, GemType } from '../types';
import { Bot } from './Bot';
import { calculatePayment } from '../reducer';

export class RandomBot implements Bot {
  name = 'random';

  takeTurn(state: SplendorGameState, playerId: string): SplendorAction | null {
    const player = state.players[playerId];
    if (!player) return null;

    if (state.turnState === 'choose_noble') {
      const nobleId = state.eligibleNoblesForCurrentPlayer[0].id;
      return { type: 'CHOOSE_NOBLE', payload: { nobleId } } as any;
    }

    if (state.turnState === 'discard_tokens') {
      const toDiscard: Partial<GemInventory> = {};
      let count = state.pendingDiscardCount;
      const tempGems = { ...player.gems };
      while (count > 0) {
        const available = BaseGemTypes.filter(g => tempGems[g] > 0);
        if (available.length === 0) break;
        const g = available[Math.floor(Math.random() * available.length)];
        tempGems[g]--;
        toDiscard[g] = (toDiscard[g] || 0) + 1;
        count--;
      }
      return { type: 'DISCARD_GEMS', payload: { gems: toDiscard } } as any;
    }

    for (const card of player.reservedCards) {
      if (calculatePayment(player, card)) {
        return { type: 'PURCHASE_RESERVED_CARD', payload: { cardId: card.id } } as any;
      }
    }

    for (const tier of ['tier3', 'tier2', 'tier1'] as const) {
      for (const card of state.board[tier]) {
        if (card && calculatePayment(player, card)) {
          const tierNum = tier === 'tier1' ? 1 : tier === 'tier2' ? 2 : 3;
          return { type: 'PURCHASE_CARD_BOARD', payload: { tier: tierNum, cardId: card.id } } as any;
        }
      }
    }

    if (Math.random() < 0.1 && player.reservedCards.length < 3) {
      if (state.decks.tier1.length > 0) {
        return { type: 'RESERVE_CARD_DECK', payload: { tier: 1 } } as any;
      }
    }

    if (Math.random() < 0.33) {
      const availableDouble = BaseGemTypes.filter(g => state.bank[g] >= 4);
      if (availableDouble.length > 0) {
        const g = availableDouble[Math.floor(Math.random() * availableDouble.length)];
        return { type: 'TAKE_GEMS', payload: { gems: { [g]: 2 } } } as any;
      }
    }

    const availableTypes = BaseGemTypes.filter(g => state.bank[g] > 0);
    const toTake: Partial<GemInventory> = {};
    const numToTake = Math.min(3, availableTypes.length);
    
    for (let i = availableTypes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableTypes[i], availableTypes[j]] = [availableTypes[j], availableTypes[i]];
    }

    for (let i = 0; i < numToTake; i++) {
      toTake[availableTypes[i]] = 1;
    }

    if (numToTake > 0) {
       return { type: 'TAKE_GEMS', payload: { gems: toTake } } as any;
    }
    
    return null;
  }
}
