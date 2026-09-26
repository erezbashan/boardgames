import { DominionState, PendingAction } from '../types';

export type CardType = 'ACTION' | 'TREASURE' | 'VICTORY' | 'ATTACK' | 'REACTION';

export interface CardDefinition {
  id: string;
  name: string;
  types: CardType[];
  cost: number;
  description: string;
  
  // When played, a card returns a list of pending actions to push to the engine stack
  onPlay?: (state: DominionState, playerId: string) => PendingAction[];
  
  // Custom bot logic for complex input requests
  botChoose?: (state: DominionState, options: any) => any;
}
