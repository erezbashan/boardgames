import type { KotAction, KotState } from '../engine/types';
import { CARD_REGISTRY } from '../engine/cards/registry';

export function getSmartBotAction(state: KotState, playerId: string): KotAction | null {
  const player = state.players[playerId];
  if (!player) return null;

  const topAction = state.pendingActions[0];
  
  if (topAction?.type === 'ASK_QUESTION' && topAction.playerId === playerId) {
     const options = topAction.payload.options as string[];
     if (options && options.length > 0) {
        // Yield Tokyo if health <= 4
        if (topAction.payload.message && topAction.payload.message.includes('yield Tokyo')) {
           if (player.health <= 4 && options.includes('Yes')) {
              return { type: 'RESPONSE_QUESTION', payload: { response: 'Yes' } };
           }
           if (options.includes('No')) {
              return { type: 'RESPONSE_QUESTION', payload: { response: 'No' } };
           }
        }
        
        // General fallback
        if (options.includes('No')) {
           return { type: 'RESPONSE_QUESTION', payload: { response: 'No' } };
        }
        return { type: 'RESPONSE_QUESTION', payload: { response: options[0] } };
     }
  }

  if (topAction?.type.startsWith('ASK') && topAction.payload?.prompt?.playerId === playerId) {
    const prompt = topAction.payload.prompt;

    if (topAction.type === 'ASK_MARKET') {
       const energy = player.energy;
       const availableMarketCards = state.market
          .map((cardId, index) => ({ cardId, index }))
          .filter(c => c.cardId !== null && c.cardId !== undefined && c.cardId !== '');
       
       const affordableCards = availableMarketCards.filter(c => {
          const cardDef = CARD_REGISTRY[c.cardId];
          if (!cardDef) return false;
          if (cardDef.type === 'Keep' && player.cards.includes(c.cardId)) return false;

          let cost = cardDef.cost;
          if (player.cards.includes('alien_metabolism') || player.cards.includes('alienMetabolism')) {
             cost = Math.max(0, cost - 1);
          }
          return energy >= cost;
       });

       if (affordableCards.length > 0) {
          // Prioritize Keep cards, especially those giving VP or healing
          affordableCards.sort((a, b) => {
             const defA = CARD_REGISTRY[a.cardId];
             const defB = CARD_REGISTRY[b.cardId];
             let scoreA = defA.type === 'Keep' ? 10 : 0;
             let scoreB = defB.type === 'Keep' ? 10 : 0;
             if (defA.description.includes('⭐')) scoreA += 5;
             if (defB.description.includes('⭐')) scoreB += 5;
             if (defA.description.includes('❤️')) scoreA += 5;
             if (defB.description.includes('❤️')) scoreB += 5;
             return scoreB - scoreA;
          });
          
          // 80% chance to buy the best card if affordable
          if (Math.random() < 0.8) {
             const toBuy = affordableCards[0];
             return { type: 'RESPONSE_MARKET', payload: { action: 'BUY', cardId: toBuy.cardId, marketIndex: toBuy.index } };
          }
       }
       
       // Sweep if energy is high
       if (energy >= 7 && Math.random() < 0.5) {
          return { type: 'RESPONSE_MARKET', payload: { action: 'SWEEP' } };
       }
       
       return { type: 'RESPONSE_MARKET', payload: { action: 'DONE' } };
    }

    if (topAction.type === 'ASK_ROLL') {
       if (state.rollCount > 0 && Math.random() < 0.8) {
          const inTokyo = player.location.startsWith('Tokyo');
          
          const toKeep = state.dice.filter(d => {
             if (d.value === 'Smash') return true; // Always keep smash to attack
             if (d.value === 'Energy') return Math.random() > 0.5;
             
             if (d.value === 'Heart') {
                if (inTokyo) return false; // Hearts don't heal in Tokyo (usually)
                return player.health < 6; // Keep if health is low outside Tokyo
             }
             
             // Numbers
             if (player.vp >= 14) return true; // Keep numbers if close to winning
             
             return false;
          }).map(d => d.id);
          
          return { type: 'RESPONSE_ROLL', payload: { roll: true, keptDiceIds: toKeep } };
       }
       return { type: 'RESPONSE_ROLL', payload: { roll: false } };
    }

    if (topAction.type === 'ASK_OPPORTUNIST') {
       if (Math.random() < 0.6 && prompt.options) {
          const buyOption = prompt.options.find((o: any) => o.label.includes('Buy'));
          if (buyOption) return buyOption.action;
       }
       return { type: 'RESPONSE_NOP', payload: {} };
    }

    if (prompt.options && prompt.options.length > 0) {
      const randomIdx = Math.floor(Math.random() * prompt.options.length);
      const opt = prompt.options[randomIdx];
      return opt.action;
    }
  }

  return null;
}
