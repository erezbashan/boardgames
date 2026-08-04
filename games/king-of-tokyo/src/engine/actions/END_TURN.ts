import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export function handleEndTurn(st: KotState, action: PendingAction, pId: string) {
  let nextIdx = st.currentPlayerIndex;
  
  if (st.players[pId].markers && st.players[pId].markers!.extra_turn && st.players[pId].markers!.extra_turn! > 0 && st.players[pId].health > 0) {
      // The current player gets an extra turn! Consume the marker.
      st.players[pId].markers!.extra_turn! -= 1;
      addLog(st, action, `${st.players[pId].name} takes an extra turn due to Frenzy!`);
  } else {
      nextIdx = (st.currentPlayerIndex + 1) % st.playerOrder.length;
      while (st.players[st.playerOrder[nextIdx]].health <= 0) {
          nextIdx = (nextIdx + 1) % st.playerOrder.length;
      }
  }
  
  const tokyoOccupant = st.playerOrder.find(id => st.players[id].location === 'TokyoCity') || null;
  const tokyoBayOccupant = st.playerOrder.find(id => st.players[id].location === 'TokyoBay') || null;
  
  st.history.push({
    turnNum: st.history.length + 1,
    healths: st.playerOrder.reduce((acc, id) => ({ ...acc, [id]: st.players[id].health }), {}),
    vps: st.playerOrder.reduce((acc, id) => ({ ...acc, [id]: st.players[id].vp }), {}),
    tokyoOccupant,
    tokyoBayOccupant
  });

  st.currentPlayerIndex = nextIdx;
  st.turnContext = {}; // Clear context for the new turn
  st.pendingActions.unshift({ type: 'START_TURN', playerId: st.playerOrder[nextIdx] });
}
