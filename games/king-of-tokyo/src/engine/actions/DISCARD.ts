import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';
import { CARD_REGISTRY } from '../cards/registry';

export function handleDiscard(st: KotState, action: PendingAction, pId: string) {
  const cardId = action.payload.cardId;
  const card = CARD_REGISTRY[cardId];
  if (st.players[pId].cards.includes(cardId)) {
     st.players[pId].cards = st.players[pId].cards.filter(id => id !== cardId);
     addLog(st, action, `🚮 ${st.players[pId].name} discarded ${card ? card.name : cardId}`);
  }
}
