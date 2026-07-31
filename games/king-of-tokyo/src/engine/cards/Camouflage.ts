import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export const Camouflage: CardImplementation = {
  id: 'camouflage',
  name: 'Camouflage',
  cost: 3,
  type: 'Keep',
  description: 'If you take damage, roll a die for each damage point. On a ❤️ result, you do not take that damage point.',
  verified: true,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'TAKE_DAMAGE' && action.playerId === pId && action.payload.amount > 0) {
      if (action.payload._camouflagePrompted) {
        return st;
      }
      
      action.payload._camouflagePrompted = true;
      
      const faces = ['1', '2', '3', 'Heart', 'Attack', 'Energy'];
      let heartsRolled = 0;
      for (let i = 0; i < action.payload.amount; i++) {
        const faceIndex = Math.floor(Math.random() * 6);
        if (faces[faceIndex] === 'Heart') heartsRolled++;
      }
      
      if (heartsRolled > 0) {
        action.payload.amount = Math.max(0, action.payload.amount - heartsRolled);
        addLog(st, action, `${st.players[pId].name} rolled ${heartsRolled} ❤️ and ignored ${heartsRolled} damage! [Camouflage]`);
      } else {
        addLog(st, action, `${st.players[pId].name} used Camouflage but rolled no ❤️!`);
      }
    }
    return st;
  }
};
