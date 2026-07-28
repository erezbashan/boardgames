import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const Camouflage: CardImplementation = {
  id: 'camouflage',
  name: 'Camouflage',
  cost: 3,
  type: 'Keep',
  description: 'If you take damage, roll a die. On a Heart, you take no damage.',
  verified: false,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'TAKE_DAMAGE' && action.playerId === pId && action.payload.amount > 0) {
      if (action.payload._camouflagePrompted) {
        return st;
      }
      
      action.payload._camouflagePrompted = true;
      
      const faceIndex = Math.floor(Math.random() * 6);
      const faces = ['1', '2', '3', 'Heart', 'Attack', 'Energy'];
      const rolledFace = faces[faceIndex];
      
      if (rolledFace === 'Heart') {
        const preventDamageAction: PendingAction = {
          type: 'RESPONSE_MULTIPLE_ACTIONS',
          playerId: pId,
          payload: {
            actions: [
              { type: 'LOG', payload: { message: `${st.players[pId].name} rolled a Heart with Camouflage and takes no damage!` } },
              { ...action, payload: { ...action.payload, amount: 0, reason: 'Camouflage', skipLog: true } }
            ]
          }
        };
        
        st.pendingActions.shift();
        st.pendingActions.unshift(preventDamageAction);
      } else {
        st.pendingActions.unshift({ type: 'LOG', payload: { message: `${st.players[pId].name} rolled a ${rolledFace} for Camouflage and failed to evade damage.` } });
      }
    }
    return st;
  }
};
