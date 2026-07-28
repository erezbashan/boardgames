import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export function handleLog(st: KotState, action: PendingAction, pId: string) {
  addLog(st, action, action.payload.message);
}
