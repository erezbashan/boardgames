import { KotPlayer, KotState, PendingAction } from '../engine/types';
import { getBotAction as getRandomBotAction } from './randomBot';
import { CARD_REGISTRY } from '../engine/cards/registry';
import { getStateIndex } from './paramBot';

import { GlobalQTableCache } from '@erez/boardgame-core';

export function getBotAction(state: KotState, playerId: string): PendingAction | null {
  const player = state.players[playerId];
  if (!player) return null;

  const topAction = state.pendingActions[0];
  if (!topAction) return null;

  let qTable: number[][] = [];
  let epsilon = 0.05;

  if (player.botStrategy?.startsWith('qlearn:')) {
      const simId = player.botStrategy.substring(7);
      const cache = GlobalQTableCache.get(simId);
      if (cache) {
          qTable = cache.qTable;
          epsilon = cache.epsilon;
      }
  }

  const stateIdx = getStateIndex(player, state);
  
  // Epsilon-greedy action selection
  let actionMask = 15; // default
  if (qTable.length === 54 && qTable[stateIdx]?.length === 31) {
      if (Math.random() < epsilon) {
          // Explore: Pick random action mask from 1 to 31
          actionMask = Math.floor(Math.random() * 31) + 1;
      } else {
          // Exploit: Pick best action mask (argmax)
          const row = qTable[stateIdx];
          let maxQ = -Infinity;
          let bestA = 0;
          for (let a = 0; a < row.length; a++) {
              if (row[a] > maxQ) {
                  maxQ = row[a];
                  bestA = a;
              }
          }
          actionMask = bestA + 1; // actions are 1-indexed (1 to 31)
      }
  } else {
      // Fallback if missing Q-table
      actionMask = Math.floor(Math.random() * 31) + 1;
  }

  // The __qTransition property will be captured by the reducer
  const transition = { stateIdx, actionMask };

  // --- Decoding actionMask into specific bot actions (copied from paramBot) ---

  if (topAction?.type === 'ASK_ROLL' && topAction.payload?.prompt?.playerId === playerId) {
    const targetAttack = (actionMask & 1) > 0;
    const targetHealth = (actionMask & 2) > 0;
    const targetEnergy = (actionMask & 4) > 0;
    const targetPoints = (actionMask & 8) > 0;

    const dice = state.dice;
    const keepIds: string[] = [];
    
    // Always keep points if we have 2 or 3 of them already? We will just map the raw targets.
    let pointsCount: Record<string, number> = { '1': 0, '2': 0, '3': 0 };
    dice.forEach(d => { if (d.value === '1' || d.value === '2' || d.value === '3') pointsCount[d.value]++; });

    dice.forEach(d => {
      if (d.kept) {
        keepIds.push(d.id);
        return;
      }
      if (targetAttack && d.value === 'Smash') keepIds.push(d.id);
      if (targetHealth && d.value === 'Heart') {
        if (player.health < (player.maxHealth || 10)) keepIds.push(d.id);
      }
      if (targetEnergy && d.value === 'Energy') keepIds.push(d.id);
      
      if (targetPoints) {
        if (d.value === '3') keepIds.push(d.id);
        else if (d.value === '2' && pointsCount['2'] >= 2) keepIds.push(d.id);
        else if (d.value === '1' && pointsCount['1'] >= 2) keepIds.push(d.id);
      }
    });

    return { type: 'RESPONSE_ROLL', payload: { roll: true, keptDiceIds: keepIds }, __qTransition: transition } as any;
  }

  if (topAction?.type === 'ASK_MARKET' && topAction.playerId === playerId) {
    const energy = player.energy;
    const availableMarketCards = state.market
        .map((cardId, index) => ({ cardId, index }))
        .filter(c => c.cardId !== null && c.cardId !== undefined && c.cardId !== '');

    const affordableCards = availableMarketCards.filter(c => {
        const cardDef = CARD_REGISTRY[c.cardId];
        if (!cardDef) return false;
        
        // Don't buy Keep cards we already have
        if (cardDef.type === 'Keep' && player.cards.includes(c.cardId)) return false;

        let cost = cardDef.cost;
        if (player.cards.includes('alien_metabolism') || player.cards.includes('alienMetabolism')) {
            cost = Math.max(0, cost - 1);
        }
        return energy >= cost;
    });

    if (affordableCards.length > 0) {
      if (Math.random() < 0.5) {
         const toBuy = affordableCards[Math.floor(Math.random() * affordableCards.length)];
         return { type: 'RESPONSE_MARKET', payload: { action: 'BUY', cardId: toBuy.cardId, marketIndex: toBuy.index }, __qTransition: transition } as any;
      }
    }
    return { type: 'RESPONSE_MARKET', payload: { action: 'DONE' }, __qTransition: transition } as any;
  }

  if (topAction?.type === 'ASK' && topAction.payload?.prompt?.playerId === playerId) {
    if (topAction.payload.prompt.text && topAction.payload.prompt.text.includes('yield Tokyo')) {
      const stayTokyo = (actionMask & 16) > 0;
      const options = topAction.payload.prompt.options as any[];
      if (stayTokyo && options.some(o => o.label === 'Stay')) {
        return { ...options.find(o => o.label === 'Stay').action, __qTransition: transition } as any;
      } else if (!stayTokyo && options.some(o => o.label === 'Yield')) {
        return { ...options.find(o => o.label === 'Yield').action, __qTransition: transition } as any;
      }
    }
    
    // For other questions (like Mimic, etc.), just answer randomly for now
    return getRandomBotAction(state, playerId);
  }

  return getRandomBotAction(state, playerId);
}
