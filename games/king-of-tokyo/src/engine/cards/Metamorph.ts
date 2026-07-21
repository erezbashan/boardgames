import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';
import { CARD_REGISTRY } from './registry';

export const Metamorph: CardImplementation = {
  id: 'metamorph',
  name: 'Metamorph',
  cost: 3,
  type: 'Keep',
  description: 'At the end of your turn you can discard any keep cards you have to receive the ⚡ they were purchased for.',
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    // Only prompt when it's literally the END_TURN action being processed
    if (action.type === 'END_TURN' && pId === st.playerOrder[st.currentPlayerIndex]) {
       const keepCards = st.players[pId].cards.filter(cId => cId !== 'metamorph');
       if (keepCards.length > 0) {
          st.pendingActions.unshift({ type: 'METAMORPH_PROMPT', playerId: pId });
       }
    }
    
    if (action.type === 'METAMORPH_PROMPT' && action.playerId === pId) {
       const keepCards = st.players[pId].cards;
       if (keepCards.length > 0) {
          const options: any[] = keepCards.map(cId => {
             const c = CARD_REGISTRY[cId];
             return {
                label: `Discard ${c.name} (+${c.cost}⚡)`,
                action: { 
                   type: 'RESPONSE_MULTIPLE_ACTIONS', 
                   payload: { 
                      actions: [
                         { type: 'DISCARD', payload: { cardId: cId }, playerId: pId },
                         { type: 'ENERGY', payload: { amount: c.cost }, playerId: pId },
                         { type: 'METAMORPH_PROMPT', playerId: pId }
                      ]
                   }
                }
             };
          });
          options.push({ label: 'Done', action: { type: 'NOP' } });
          
          st.pendingActions.unshift({
             type: 'ASK',
             playerId: pId,
             payload: {
                prompt: {
                   playerId: pId,
                   text: 'Metamorph: Discard cards for Energy?',
                   options
                }
             }
          });
       }
    }
    
    return st;
  }
};
