import { KotState, PendingAction } from '../types';

export function handleGoToMarket(st: KotState, action: PendingAction, pId: string) {
  st.pendingActions = [
    { type: 'SETUP_CARD_PRICES', playerId: pId },
    { type: 'BUY_OR_SWEEP', playerId: pId },
    ...st.pendingActions
  ];
}
