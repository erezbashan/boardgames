import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export function handleResolveRolls(st: KotState, action: PendingAction, pId: string) {
  const outcomeMap: Record<string, number> = {};
  st.dice.forEach(d => { outcomeMap[d.value] = (outcomeMap[d.value] || 0) + 1; });
  
  const diceActions: PendingAction[] = [];
  
  const emojiMap: Record<string, string> = { Heart: '❤️', Energy: '⚡', Smash: '💥', '1': '1️⃣', '2': '2️⃣', '3': '3️⃣' };
  const outcomeStr = st.dice.map(d => emojiMap[d.value] || d.value).join(' ');
  addLog(st, action, `${st.players[pId].name} resolved: ${outcomeStr}`);

  if (outcomeMap['1'] >= 3) diceActions.push({ type: 'VP', payload: { amount: 1 + (outcomeMap['1'] - 3) }, playerId: pId });
  if (outcomeMap['2'] >= 3) diceActions.push({ type: 'VP', payload: { amount: 2 + (outcomeMap['2'] - 3) }, playerId: pId });
  if (outcomeMap['3'] >= 3) diceActions.push({ type: 'VP', payload: { amount: 3 + (outcomeMap['3'] - 3) }, playerId: pId });
  if (outcomeMap['Smash']) diceActions.push({ type: 'ATTACK', payload: { damage: outcomeMap['Smash'] }, playerId: pId });
  if (outcomeMap['Heart']) diceActions.push({ type: 'HEALTH', payload: { amount: outcomeMap['Heart'] }, playerId: pId });
  if (outcomeMap['Energy']) diceActions.push({ type: 'ENERGY', payload: { amount: outcomeMap['Energy'] }, playerId: pId });

  st.pendingActions = [...diceActions, ...st.pendingActions];
}
