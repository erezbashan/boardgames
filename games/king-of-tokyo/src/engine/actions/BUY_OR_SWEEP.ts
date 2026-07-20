import { KotState, PendingAction } from '../types';

export function handleBuyOrSweep(st: KotState, action: PendingAction, pId: string) {
  const canSweep = st.players[pId].energy >= 2 && st.deck.length > 0;
  const canPurchase = false; // simplifying for now
  if (canSweep || canPurchase) {
     st.pendingActions.unshift({ type: 'ASK_MARKET', playerId: pId, payload: {
        prompt: {
          playerId: pId,
          text: 'Buy Phase',
          options: [
            { label: 'Done', action: { type: 'RESPONSE_MARKET', payload: { action: 'DONE' } } },
            { label: 'Sweep (2⚡)', action: { type: 'RESPONSE_MARKET', payload: { action: 'SWEEP' } } }
          ]
        }
     } });
  }
}
