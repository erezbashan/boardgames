import { KotState, PendingAction } from '../types';

export function handleResponseMarket(st: KotState, action: PendingAction, pId: string) {
  if (action.payload.action === 'SWEEP') {
    st.pendingActions.unshift({ type: 'BUY_OR_SWEEP', playerId: pId }); // Go back to buy options
    st.pendingActions.unshift({ type: 'SWEEP', playerId: pId });
  } else if (action.payload.action === 'BUY') {
    st.pendingActions.unshift({ type: 'BUY_OR_SWEEP', playerId: pId });
    st.pendingActions.unshift({ type: 'BUY', playerId: pId, payload: { cardId: action.payload.cardId, marketIndex: action.payload.marketIndex } });
  }
}
