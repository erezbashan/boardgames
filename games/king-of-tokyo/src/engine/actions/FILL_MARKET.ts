import { KotState, PendingAction } from '../types';
import { CARD_REGISTRY } from '../cards/registry';
import { addLog } from '../utils';

export function handleFillMarket(st: KotState, action: PendingAction, pId: string) {
  const index = action.payload.index;
  if (st.deck.length > 0 && index >= 0 && index < 3) {
      const newCardId = st.deck.shift()!;
      st.market[index] = newCardId;
      const cardDef = CARD_REGISTRY[newCardId];
      if (cardDef) {
          addLog(st, action, `🎴 Card revealed: ${cardDef.name}`);
      }
      st.pendingActions.unshift({ type: 'CARD_REVEALED', playerId: pId, payload: { cardId: newCardId, marketIndex: index } });
  }
}
