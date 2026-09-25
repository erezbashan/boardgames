import { SplendorGameState, SplendorAction } from '../types';

export interface Bot {
  name: string;
  takeTurn(state: SplendorGameState, playerId: string): SplendorAction | null;
}
