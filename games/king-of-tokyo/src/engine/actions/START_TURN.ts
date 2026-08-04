import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export function handleStartTurn(st: KotState, action: PendingAction, pId: string) {
  const p = st.players[pId];
  
  // Log the start of the turn
  addLog(st, action, `--- 👾 ${p.name}'s Turn ---`);
  
  // Sanity check: Ensure correct number of people in Tokyo
  const { isTokyoBayActive } = require('../utils');
  const peopleInTokyo = st.playerOrder.filter(id => st.players[id].location.startsWith('Tokyo') && st.players[id].health > 0);
  const maxAllowed = isTokyoBayActive(st) ? 2 : 1;
  if (peopleInTokyo.length > maxAllowed) {
     addLog(st, action, `⚠️ WARNING: Too many monsters detected in Tokyo! Evicting extras.`);
     // Keep up to maxAllowed players, prefer current player
     const toKeep = new Set<string>();
     if (peopleInTokyo.includes(pId)) toKeep.add(pId);
     for (const id of peopleInTokyo) {
       if (toKeep.size < maxAllowed) toKeep.add(id);
     }
     peopleInTokyo.forEach(id => {
        if (!toKeep.has(id)) {
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
  
  if (p && p.location.startsWith('Tokyo')) {
    addLog(st, action, `${p.name} starts turn in Tokyo`);
    st.pendingActions.unshift({ type: 'VP', payload: { amount: 2 }, playerId: pId });
  }
}
