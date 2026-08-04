import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export const SmokeCloud: CardImplementation = {
  id: 'smoke_cloud',
  name: 'Smoke Cloud',
  cost: 4,
  type: 'Keep',
  description: 'Put 3 charge counters on this card. Spend a charge for an extra reroll.',
  verified: false,
  onBuy: (st: KotState, action: PendingAction, pId: string) => {
     st.players[pId].cardState = st.players[pId].cardState || {};
     st.players[pId].cardState.smokeCloudCharges = 3;
     addLog(st, action, `${st.players[pId].name} got Smoke Cloud with 3 charges!`);
     return st;
  },
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'RESOLVE_ROLLS' && action.playerId === pId) {
       const charges = st.players[pId].cardState?.smokeCloudCharges || 0;
       if (charges > 0 && !action.payload?._smokeCloudPrompted) {
          const index = st.pendingActions.findIndex(a => a === action);
          if (index !== -1) {
             action.payload = action.payload || {};
             action.payload._smokeCloudPrompted = true;
             st.pendingActions.splice(index, 1);
             st.pendingActions.unshift({
                type: 'ASK',
                playerId: pId,
                payload: {
                   prompt: {
                      playerId: pId,
                      text: `Smoke Cloud: Spend 1 of ${charges} charges for an extra reroll?`,
                      options: [
                         { label: 'Yes', action: { type: 'RESPONSE_SMOKE_CLOUD', playerId: pId, payload: { originalAction: action } } },
                         { label: 'No', action: { type: 'RESPONSE_SMOKE_CLOUD_NO', playerId: pId, payload: { originalAction: action } } }
                      ]
                   }
                }
             });
          }
       }
    }
    
    if (action.type === 'RESPONSE_SMOKE_CLOUD' && action.playerId === pId) {
       let charges = st.players[pId].cardState?.smokeCloudCharges || 0;
       if (charges > 0) {
          charges -= 1;
          st.players[pId].cardState!.smokeCloudCharges = charges;
          st.maxRolls = (st.maxRolls || 3) + 1;
          st.rollCount = (st.rollCount || 0) + 1;
          
          action.affectedByCards = [{ cardId: 'smoke_cloud', playerId: pId }];
          addLog(st, action, `${st.players[pId].name} spent a charge from Smoke Cloud for an extra reroll! (${charges} left)`);
          
          if (charges === 0) {
             st.players[pId].cards = st.players[pId].cards.filter(c => c !== 'smoke_cloud');
             addLog(st, action, `Smoke Cloud is out of charges and is discarded!`);
          }
          
          // Go back to rolling phase
          st.pendingActions.unshift({ type: 'RESOLVE_ROLLS', playerId: pId, payload: { ...action.payload.originalAction.payload, _smokeCloudPrompted: true } });
          st.pendingActions.unshift({ type: 'ASK_ROLL', playerId: pId, payload: { prompt: { playerId: pId, text: 'Roll Dice?', options: [] } } });
       }
    }
    
    if (action.type === 'RESPONSE_SMOKE_CLOUD_NO' && action.playerId === pId) {
       const nextAction = { ...action.payload.originalAction, payload: { ...action.payload.originalAction.payload, _smokeCloudPrompted: true } };
       delete nextAction.skipPreEvent;
       st.pendingActions.unshift(nextAction);
    }
    return st;
  }
};
