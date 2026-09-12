import { KotState, PendingAction } from '../types';
import { CARD_REGISTRY } from '../cards/registry';

export function handleBuyOrSweep(st: KotState, action: PendingAction, pId: string) {
  const p = st.players[pId];
  const discount = st.turnContext?.buyDiscount || 0;
  
  const canPurchase = st.market.some(c => {
    if (!c) return false;
    const cardDef = CARD_REGISTRY[c];
    if (!cardDef) return false;
    const effectiveCost = Math.max(0, cardDef.cost - discount);
    return p.energy >= effectiveCost;
  });
  
  const canSweep = p.energy >= 2 && st.deck.length > 0;

  if (canSweep || canPurchase) {
     st.pendingActions.unshift({ type: 'ASK_MARKET', playerId: pId, payload: {
        prompt: {
          playerId: pId,
          text: 'Buy Phase',
          options: [
            { label: 'Done', action: { type: 'RESPONSE_MARKET', payload: { action: 'DONE' } } },
            ...(canSweep ? [{ label: 'Sweep (2⚡)', action: { type: 'RESPONSE_MARKET', payload: { action: 'SWEEP' } } }] : [])
          ]
        }
     } });
  }
}
