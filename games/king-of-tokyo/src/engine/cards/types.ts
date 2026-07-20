import { KotState, PendingAction } from '../reducer';

export interface CardImplementation {
  id: string;
  name: string;
  cost: number;
  type: 'Keep' | 'Discard';
  description: string;
  onPreEvent?: (state: KotState, action: PendingAction) => KotState;
  onPostEvent?: (state: KotState, action: PendingAction) => KotState;
}
