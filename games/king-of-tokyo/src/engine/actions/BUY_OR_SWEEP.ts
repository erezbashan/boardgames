import { KotState, PendingAction } from '../types';

export function handleBuyOrSweep(st: KotState, action: PendingAction, pId: string) {
  const canSweep = st.players[pId].energy >= 2;
  const canPurchase = false; // simplifying for now
  if (canSweep || canPurchase) {
     st.pendingActions.unshift({ type: 'ASK_MARKET', payload: {
        prompt: {
          playerId: pId,
          text: 'Buy Cards?',
          options: [
            { label: 'Done', action: { type: 'RESPONSE_MARKET', payload: { action: 'DONE' } } },
            { label: 'Sweep (2⚡)', action: { type: 'RESPONSE_MARKET', payload: { action: 'SWEEP' } } }
          ]
        }
     } });
  }
}
