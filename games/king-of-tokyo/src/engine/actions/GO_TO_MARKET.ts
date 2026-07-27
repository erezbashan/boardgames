import { KotState, PendingAction } from '../types';

export function handleGoToMarket(st: KotState, action: PendingAction, pId: string) {
  st.turnContext = st.turnContext || {};
  st.turnContext.buyDiscount = 0;
  st.pendingActions = [
    { type: 'BUY_OR_SWEEP', playerId: pId },
    ...st.pendingActions
  ];
}
