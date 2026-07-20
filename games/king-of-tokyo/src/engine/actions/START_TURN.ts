import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export function handleStartTurn(st: KotState, action: PendingAction, pId: string) {
  const p = st.players[pId];
  st.pendingActions = [
    { type: 'SETUP_DICE', playerId: pId },
    { type: 'ASK_ROLL', playerId: pId, payload: {
       prompt: {
         playerId: pId,
         text: 'Roll Dice?',
         options: [
           { label: 'Roll', action: { type: 'RESPONSE_ROLL', payload: { roll: true } } },
           { label: 'Resolve', action: { type: 'RESPONSE_ROLL', payload: { roll: false } } }
         ]
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
