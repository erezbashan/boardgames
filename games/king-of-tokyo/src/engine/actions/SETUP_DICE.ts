import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export function handleSetupDice(st: KotState, action: PendingAction, pId: string) {
  const diceCount = 6;
  st.dice = Array.from({ length: diceCount }).map((_, i) => ({ id: `d${i}`, value: '1', kept: false }));
  st.maxRolls = 3;
  st.rollCount = st.maxRolls;
  addLog(st, action, `${st.dice.length} dice are ready for up to ${st.rollCount} rolls.`);
}
