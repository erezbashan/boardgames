import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export const ExtraHead: CardImplementation = {
  id: 'extra_head',
  name: 'Extra Head',
  cost: 7,
  type: 'Keep',
  description: 'You get 1 extra die.',
  onPostEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'SETUP_DICE' && action.playerId === pId) {
       st.dice.push({ id: `d${st.dice.length}`, value: '1', kept: false });
       addLog(st, action, `${st.players[pId].name} rolls an extra die thanks to their Extra Head!`);
    }
    return st;
  }
};
