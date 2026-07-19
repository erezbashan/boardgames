import { KotCard } from './types';

export const EvacuationOrders: KotCard = {
  id: 'evacuation_orders',
  name: 'Evacuation Orders',
  cost: 7,
  type: 'Discard',
  description: 'All other monsters lose 5 ⭐.',
  onEvent: (event, payload, state) => {
    if (event === 'BUY_CARD' && payload.cardId === 'evacuation_orders') {
      const buyer = state.players[payload.playerId];
      let newState = { ...state };
      
      let changed = false;
      Object.values(newState.players).forEach(p => {
        if (p.id !== buyer.id) {
          const newVp = Math.max(0, p.vp - 5);
          if (newVp !== p.vp) {
            newState.players[p.id] = { ...p, vp: newVp };
            newState.logs.push(`${p.name} lost ${p.vp - newVp} ⭐ from Evacuation Orders!`);
            changed = true;
          }
        }
      });
      
      if (!changed) {
        newState.logs.push(`Evacuation Orders had no effect on anyone's ⭐!`);
      }

      return newState;
    }
  }
};
