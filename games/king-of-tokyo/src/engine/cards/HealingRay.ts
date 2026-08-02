import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';
import { addLog } from '../utils';

export const HealingRay: CardImplementation = {
  id: 'healing_ray',
  name: 'Healing Ray',
  cost: 4,
  type: 'Keep',
  description: 'You can heal other monsters with your ❤️ results. They must pay you 2⚡ for each damage you heal (or their remaining ⚡ if they haven\'t got enough.',
  verified: false,
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'HEALTH' && action.playerId === pId) {
       // Find how many hearts we rolled that we haven't spent on healing ray yet
       st.players[pId].cardState = st.players[pId].cardState || {};
       const spentHearts = st.players[pId].cardState.healingRaySpentHearts || 0;
       const totalHearts = action.payload.amount + spentHearts;
       const availableHearts = totalHearts - spentHearts;
       
       if (availableHearts > 0) {
          // Find damaged players
          const damagedPlayers = st.playerOrder.filter(id => id !== pId && st.players[id].health > 0 && st.players[id].health < (st.players[id].maxHealth || 10));
          if (damagedPlayers.length > 0) {
             const index = st.pendingActions.findIndex(a => a === action);
             if (index !== -1) {
                st.pendingActions.splice(index, 1);
                
                const options = damagedPlayers.map(targetId => ({
                   label: `Heal ${st.players[targetId].name} for up to 2⚡`,
                   action: { type: 'RESPONSE_HEALING_RAY', playerId: pId, payload: { originalAction: action, targetId } }
                }));
                options.push({ label: 'Done', action: { type: 'RESPONSE_HEALING_RAY_DONE', playerId: pId, payload: { originalAction: action } as any } });
                
                st.pendingActions.unshift({
                   type: 'ASK',
                   playerId: pId,
                   payload: {
                      prompt: {
                         playerId: pId,
                         text: `Healing Ray: Spend a ❤️ to heal someone for ⚡? (${availableHearts} ❤️ left)`,
                         options
                      }
                   }
                });
             }
          }
       }
    }
    
    if (action.type === 'RESPONSE_HEALING_RAY' && action.playerId === pId) {
       const { targetId } = action.payload;
       
       st.players[pId].cardState = st.players[pId].cardState || {};
       st.players[pId].cardState.healingRaySpentHearts = (st.players[pId].cardState.healingRaySpentHearts || 0) + 1;
       
       // Target heals 1 damage
       st.players[targetId].health = Math.min(st.players[targetId].health + 1, st.players[targetId].maxHealth || 10);
       
       // Target pays up to 2 energy
       const targetEnergy = st.players[targetId].energy;
       const payment = Math.min(2, targetEnergy);
       st.players[targetId].energy -= payment;
       st.players[pId].energy += payment;
       
       addLog(st, action, `💖 ${st.players[pId].name} spent a ❤️ to heal ${st.players[targetId].name} by 1 and gained ${payment}⚡! [Healing Ray]`);
       
       // Reduce one heart from the HEALTH payload so it doesn't heal pId normally
       const nextAction = { ...action.payload.originalAction };
       nextAction.payload.amount = Math.max(0, (nextAction.payload.amount || 0) - 1);
       delete nextAction.skipPreEvent;
       st.pendingActions.unshift(nextAction);
    }
    
    if (action.type === 'RESPONSE_HEALING_RAY_DONE' && action.playerId === pId) {
       // Reset spent hearts counter for next turn
       if (st.players[pId].cardState) {
          st.players[pId].cardState.healingRaySpentHearts = 0;
       }
       const nextAction = { ...action.payload.originalAction };
       delete nextAction.skipPreEvent;
       st.pendingActions.unshift(nextAction);
    }
    
    return st;
  }
};
