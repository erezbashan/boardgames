import { AcquireState, AcquireAction } from '../types';

export interface Bot {
  name: string;
  takeTurn(state: AcquireState, playerId: string): AcquireAction | null;
}
