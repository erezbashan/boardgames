import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export function handleEnterTokyo(st: KotState, action: PendingAction, pId: string) {
  st.players[pId] = { ...st.players[pId], location: 'TokyoCity' };
  addLog(st, action, `${st.players[pId].name} enters Tokyo`);
  st.pendingActions.unshift({ type: 'VP', payload: { amount: 1 }, playerId: pId });
}
