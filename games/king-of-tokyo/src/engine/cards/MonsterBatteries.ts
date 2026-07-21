import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export const MonsterBatteries: CardImplementation = {
  id: 'monster_batteries',
  name: 'Monster Batteries',
  cost: 2,
  type: 'Keep',
  description: 'When you purchase this put as many ⚡ as you want on it from your reserve. Match this from the bank. At the start of each turn take 2⚡ off and add them to your reserve. When there are no ⚡ left discard this card.',
  onBuy: (st: KotState, action: PendingAction, pId: string) => {
    st.pendingActions.unshift({ type: 'MONSTER_BATTERIES_PROMPT', playerId: pId });
    return st;
  },
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'MONSTER_BATTERIES_PROMPT' && action.playerId === pId) {
       const energy = st.players[pId].energy;
       const options = [];
       for (let i = 0; i <= energy; i++) {
          options.push({
             label: `${i}`,
             action: { type: 'RESPONSE_MONSTER_BATTERIES_SET', payload: { amount: i } }
          });
       }
       st.pendingActions.unshift({ type: 'ASK', payload: {
          prompt: {
             playerId: pId,
             text: 'How much Energy to put on Monster Batteries?',
             options
          }
       }});
    }
    
    if ((action.type === 'MONSTER_BATTERIES_SET' || action.type === 'RESPONSE_MONSTER_BATTERIES_SET') && action.playerId === pId) {
       const amount = action.payload.amount;
       st.players[pId].energy -= amount;
       st.players[pId].cardState = st.players[pId].cardState || {};
       st.players[pId].cardState['monster_batteries'] = amount * 2;
       addLog(st, action, `🔋 ${st.players[pId].name} put ${amount}⚡ on Monster Batteries, doubled to ${amount * 2}⚡!`);
       if (amount === 0) {
           st.players[pId].cards = st.players[pId].cards.filter(c => c !== 'monster_batteries');
           addLog(st, action, `Monster Batteries is empty and discarded!`);
       }
    }
    
    if (action.type === 'START_TURN' && action.playerId === pId) {
       let bat = st.players[pId].cardState?.['monster_batteries'] || 0;
       if (bat > 0) {
          const take = Math.min(2, bat);
          bat -= take;
          st.players[pId].energy += take;
          
          st.players[pId].cardState = st.players[pId].cardState || {};
          st.players[pId].cardState['monster_batteries'] = bat;
          
          addLog(st, action, `🔋 ${st.players[pId].name} took ${take}⚡ from Monster Batteries (${bat}⚡ remaining).`);
          if (bat === 0) {
             st.players[pId].cards = st.players[pId].cards.filter(c => c !== 'monster_batteries');
             addLog(st, action, `🔋 Monster Batteries is empty and discarded!`);
          }
       }
    }
    return st;
  },
  getLabel: (st: KotState, pId: string) => {
    const bat = st.players[pId].cardState?.['monster_batteries'];
    if (bat !== undefined) {
      return `${bat}⚡`;
    }
    return undefined;
  }
};
