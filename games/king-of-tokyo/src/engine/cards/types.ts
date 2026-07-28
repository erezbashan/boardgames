import { KotState, PendingAction } from '../types';

export interface CardImplementation {
  id: string;
  name: string;
  cost: number;
  type: 'Keep' | 'Discard';
  description: string;
  onPreEvent?: (state: KotState, action: PendingAction, pId: string) => KotState;
  onPostEvent?: (state: KotState, action: PendingAction, pId: string) => KotState;
  onBuy?: (state: KotState, action: PendingAction, pId: string) => KotState;
  getLabel?: (state: KotState, pId: string) => string | undefined;
}
