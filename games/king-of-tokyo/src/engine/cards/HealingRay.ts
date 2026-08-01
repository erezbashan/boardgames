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
    if (action.type === 'RESOLVE_ROLLS' && action.playerId === pId) {
       // Find how many hearts we rolled that we haven't spent on healing ray yet
       st.players[pId].cardState = st.players[pId].cardState || {};
       const spentHearts = st.players[pId].cardState.healingRaySpentHearts || 0;
       const totalHearts = st.dice.filter(d => d.value === 'Heart').length;
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
       
       addLog(st, action, `💖 ${st.players[pId].name} spent a ❤️ to heal ${st.players[targetId].name} by 1 and gained ${payment}⚡!`);
       
       // Remove one heart from the dice so it doesn't heal pId normally
       let removed = false;
       for (let i = 0; i < st.dice.length; i++) {
          if (st.dice[i].value === 'Heart' && !removed) {
             st.dice[i] = { ...st.dice[i], value: '' as any }; // dummy face
             removed = true;
          }
       }
       
       // Put RESOLVE_ROLLS back to allow multiple uses if more hearts exist
       const nextAction = { ...action.payload.originalAction };
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
