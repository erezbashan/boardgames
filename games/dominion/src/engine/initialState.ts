import { DominionState } from './types';

export const initialDominionState: DominionState = {
  players: {},
  playerOrder: [],
  currentPlayerIndex: 0,
  phase: 'ACTION',
  supply: {},
  trash: [],
  pendingActions: [],
  status: 'Lobby',
  winnerId: null,
  chatMessages: [],
  logs: ['Game created.'],
  actionQueue: []
};
