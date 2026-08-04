import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { CARD_REGISTRY } from './registry';
import { addLog } from '../utils';

export const UnstableDNA: CardImplementation = {
  id: 'unstable_dna',
  name: 'Unstable DNA',
  cost: 3,
  type: 'Keep',
  description: 'If you yield Tokyo you can take any card the recipient has and give him this card.',
  verified: false,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'RESPONSE_YIELD' && action.playerId === pId && action.payload.yield) {
       if (action.payload._unstableDnaDone) return st;
       
       const attackerId = action.payload.attackerId;
       const attackerCards = st.players[attackerId]?.cards || [];
       if (attackerCards.length > 0) {
          const index = st.pendingActions.findIndex(a => a === action);
          if (index !== -1) {
             st.pendingActions.splice(index, 1);
             const options = attackerCards.map(cId => ({
                 label: `Steal ${CARD_REGISTRY[cId]?.name || cId}`,
                 action: { type: 'RESPONSE_UNSTABLE_DNA', playerId: pId, payload: { originalAction: action, cardToSteal: cId, targetId: attackerId } }
             }));
             options.push({ label: 'No', action: { type: 'RESPONSE_UNSTABLE_DNA_NO', playerId: pId, payload: { originalAction: action } as any } });
             
             st.pendingActions.unshift({
                type: 'ASK',
                playerId: pId,
                payload: {
                   prompt: {
                      playerId: pId,
                      text: `Unstable DNA: Swap this card for one of ${st.players[attackerId].name}'s cards?`,
                      options
                   }
                }
             });
          }
       }
    }
    
    if (action.type === 'RESPONSE_UNSTABLE_DNA' && action.playerId === pId) {
       const { cardToSteal, targetId } = action.payload;
       
       // Remove Unstable DNA from pId, give to targetId
       st.players[pId].cards = st.players[pId].cards.filter(c => c !== 'unstable_dna');
       st.players[targetId].cards.push('unstable_dna');
       
       // Transfer cardState for unstable_dna if any
       if (st.players[pId].cardState && st.players[pId].cardState!['unstable_dna']) {
           st.players[targetId].cardState = st.players[targetId].cardState || {};
           st.players[targetId].cardState!['unstable_dna'] = st.players[pId].cardState!['unstable_dna'];
           delete st.players[pId].cardState!['unstable_dna'];
       }
       
       // Remove cardToSteal from targetId, give to pId
       st.players[targetId].cards = st.players[targetId].cards.filter(c => c !== cardToSteal);
       st.players[pId].cards.push(cardToSteal);
       
       // Transfer cardState for cardToSteal
       if (st.players[targetId].cardState) {
           const toCamelCase = (str: string) => str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
           const camelId = toCamelCase(cardToSteal);
           
           for (const key in st.players[targetId].cardState) {
               if (key === cardToSteal || key.startsWith(camelId)) {
                   st.players[pId].cardState = st.players[pId].cardState || {};
                   st.players[pId].cardState[key] = st.players[targetId].cardState[key];
                   delete st.players[targetId].cardState[key];
               }
           }
       }
       
       addLog(st, action, `${st.players[pId].name} used Unstable DNA to steal ${CARD_REGISTRY[cardToSteal]?.name || cardToSteal} from ${st.players[targetId].name}!`);
       
       const nextAction = { ...action.payload.originalAction, payload: { ...action.payload.originalAction.payload, _unstableDnaDone: true } };
       delete nextAction.skipPreEvent;
       st.pendingActions.unshift(nextAction);
    }
    
    if (action.type === 'RESPONSE_UNSTABLE_DNA_NO' && action.playerId === pId) {
       const nextAction = { ...action.payload.originalAction, payload: { ...action.payload.originalAction.payload, _unstableDnaDone: true }, affectedByCards: action.payload.originalAction.affectedByCards || [] };
       delete nextAction.skipPreEvent;
       st.pendingActions.unshift(nextAction);
    }
    
    return st;
  }
};
