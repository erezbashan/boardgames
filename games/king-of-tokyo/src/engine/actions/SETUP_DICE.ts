import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export function handleSetupDice(st: KotState, action: PendingAction, pId: string) {
  st.dice = st.dice.map(d => ({ ...d, kept: false, value: '1' }));
  st.rollCount = 3;
  addLog(st, action, `6 dice are ready for up to 3 rolls.`);
}
