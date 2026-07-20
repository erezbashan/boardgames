import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export function handleSetupDice(st: KotState, action: PendingAction, pId: string) {
  const DICE_FACES = ['Heart', 'Energy', 'Smash', '1', '2', '3'] as const;
  st.dice = st.dice.map(d => ({ ...d, kept: false, value: DICE_FACES[Math.floor(Math.random() * DICE_FACES.length)] as any }));
  st.rollCount = 2; // They get 2 remaining optional rolls
  addLog(st, action, `${st.dice.length} dice are ready for up to ${st.rollCount} more rolls.`);
}
