import { KotState, PendingAction } from '../types';
import { addLog, isTokyoBayActive } from '../utils';

export function handleEnterTokyo(st: KotState, action: PendingAction, pId: string) {
  // If the player is already in Tokyo, do nothing
  if (st.players[pId].location.startsWith('Tokyo')) return;
  
  const tokyoCityOccupant = st.playerOrder.find(id => st.players[id].location === 'TokyoCity' && st.players[id].health > 0);
  
  if (!tokyoCityOccupant) {
    st.players[pId] = { ...st.players[pId], location: 'TokyoCity' };
    addLog(st, action, `${st.players[pId].name} enters Tokyo City`);
    st.pendingActions.unshift({ type: 'VP', payload: { amount: 1 }, playerId: pId });
  } else if (isTokyoBayActive(st)) {
    const tokyoBayOccupant = st.playerOrder.find(id => st.players[id].location === 'TokyoBay' && st.players[id].health > 0);
    if (!tokyoBayOccupant) {
      st.players[pId] = { ...st.players[pId], location: 'TokyoBay' };
      addLog(st, action, `${st.players[pId].name} enters Tokyo Bay`);
      st.pendingActions.unshift({ type: 'VP', payload: { amount: 1 }, playerId: pId });
    } else {
      // Both are occupied, can't enter! (Should only happen if logic forced an enter when full)
      addLog(st, action, `${st.players[pId].name} could not enter Tokyo (Full)`);
    }
  } else {
    // Tokyo City is full and Bay is not active
    addLog(st, action, `${st.players[pId].name} could not enter Tokyo (Full)`);
  }
}
