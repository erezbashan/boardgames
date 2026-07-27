import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export function handleStartTurn(st: KotState, action: PendingAction, pId: string) {
  const p = st.players[pId];
  
  // Log the start of the turn
  addLog(st, action, `--- 👾 ${p.name}'s Turn ---`);
  
  // Sanity check: Ensure only one person is in Tokyo
  const peopleInTokyo = st.playerOrder.filter(id => st.players[id].location === 'TokyoCity' && st.players[id].health > 0);
  if (peopleInTokyo.length > 1) {
     addLog(st, action, `⚠️ WARNING: Multiple monsters detected in Tokyo! Evicting everyone except the current player or the first one found.`);
     peopleInTokyo.forEach(id => {
        if (id !== pId && (peopleInTokyo[0] !== id || peopleInTokyo.includes(pId))) {
           st.players[id] = { ...st.players[id], location: 'Outside' };
        }
     });
  }
  
  st.pendingActions = [
    { type: 'SETUP_DICE', playerId: pId },
    { type: 'ASK_ROLL', playerId: pId, payload: {
       prompt: {
         playerId: pId,
         text: 'Roll Dice?',
         options: []
       }
    } },
    { type: 'RESOLVE_ROLLS', playerId: pId },
    { type: 'GO_TO_MARKET', playerId: pId },
    { type: 'END_TURN', playerId: pId },
    ...st.pendingActions
  ];
  
  if (p && p.location === 'TokyoCity') {
    addLog(st, action, `${p.name} starts turn in Tokyo!`);
    st.pendingActions.unshift({ type: 'VP', payload: { amount: 2 }, playerId: pId });
  }
}
