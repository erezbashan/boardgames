import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export function handleAttack(st: KotState, action: PendingAction, pId: string) {
  const attacker = st.players[pId];
  const damage = action.payload.damage;
  const reasonStr = action.payload.reason ? ` (${action.payload.reason})` : '';
  addLog(st, action, `${attacker.name} attacks for ${damage}${reasonStr}`);

  const actionsToPush: PendingAction[] = [];

  const getPlayersInTurnOrderFrom = (st: KotState, pId: string) => {
    const idx = st.playerOrder.indexOf(pId);
    return [...st.playerOrder.slice(idx + 1), ...st.playerOrder.slice(0, idx)];
  };

  const targets = getPlayersInTurnOrderFrom(st, pId);

  if (attacker.location === 'Outside') {
     const tokyoPlayers = targets.filter(id => st.players[id].location === 'TokyoCity' && st.players[id].health > 0);
     if (tokyoPlayers.length === 0) {
        actionsToPush.push({ type: 'ENTER_TOKYO', playerId: pId });
     } else {
        tokyoPlayers.forEach(tId => {
           actionsToPush.push({ type: 'TAKE_DAMAGE', payload: { amount: damage, yield_after: true, attackerId: pId }, playerId: tId });
        });
     }
  } else {
     targets.forEach(tId => {
        if (st.players[tId].location === 'Outside' && st.players[tId].health > 0) {
           actionsToPush.push({ type: 'TAKE_DAMAGE', payload: { amount: damage, attackerId: pId }, playerId: tId });
        }
     });
  }

  st.pendingActions = [...actionsToPush, ...st.pendingActions];
}
