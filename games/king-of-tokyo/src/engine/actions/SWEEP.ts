import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export function handleSweep(st: KotState, action: PendingAction, pId: string) {
  st.players[pId].energy -= 2;
  addLog(st, action, `${st.players[pId].name} paid 2 ⚡ to sweep the market!`);
  const newDeck = [...st.deck];
  st.market = ['', '', ''];
  st.deck = newDeck;
  
  // We unshift in reverse order so they are executed in 0,1,2 order
  st.pendingActions.unshift({ type: 'FILL_MARKET', playerId: pId, payload: { index: 2 } });
  st.pendingActions.unshift({ type: 'FILL_MARKET', playerId: pId, payload: { index: 1 } });
  st.pendingActions.unshift({ type: 'FILL_MARKET', playerId: pId, payload: { index: 0 } });
}
