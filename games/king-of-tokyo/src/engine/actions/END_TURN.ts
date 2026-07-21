import { KotState, PendingAction } from '../types';

export function handleEndTurn(st: KotState, action: PendingAction, pId: string) {
  let nextIdx = (st.currentPlayerIndex + 1) % st.playerOrder.length;
  while (st.players[st.playerOrder[nextIdx]].health <= 0) {
      nextIdx = (nextIdx + 1) % st.playerOrder.length;
  }
  
  const tokyoOccupant = st.playerOrder.find(id => st.players[id].location === 'TokyoCity') || null;
  
  st.history.push({
    turnNum: st.history.length + 1,
    healths: st.playerOrder.reduce((acc, id) => ({ ...acc, [id]: st.players[id].health }), {}),
    vps: st.playerOrder.reduce((acc, id) => ({ ...acc, [id]: st.players[id].vp }), {}),
    tokyoOccupant
  });

  st.currentPlayerIndex = nextIdx;
  st.turnContext = {}; // Clear context for the new turn
  st.pendingActions.unshift({ type: 'START_TURN', playerId: st.playerOrder[nextIdx] });
}
