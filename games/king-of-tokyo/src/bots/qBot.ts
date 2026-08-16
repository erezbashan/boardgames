import { KotPlayer, KotState, PendingAction } from '../engine/types';
import { getBotAction as getRandomBotAction } from './randomBot';
import { CARD_REGISTRY } from '../engine/cards/registry';
import { getStateIndex } from './paramBot';

export function getBotAction(state: KotState, playerId: string): PendingAction | null {
  const player = state.players[playerId];
  if (!player) return null;

  const topAction = state.pendingActions[0];
  if (!topAction) return null;

  // Parse Q-learning strategy
  let qTable: number[][] = [];
  let epsilon = 0.05;
  try {
      if (player.botStrategy?.startsWith('qlearn:')) {
          const config = JSON.parse(player.botStrategy.substring(7));
          qTable = config.qTable || [];
          epsilon = typeof config.epsilon === 'number' ? config.epsilon : 0.05;
      }
  } catch (e) {}

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

    return { type: 'RESPONSE_ROLL', payload: { keepIds }, __qTransition: transition } as any;
  }

  if (topAction?.type === 'ASK_MARKET' && topAction.playerId === playerId) {
    const marketCards = state.market;
    const affordableCards = marketCards.filter(cardId => {
      const card = CARD_REGISTRY[cardId];
      return card && player.energy >= card.cost;
    });

    if (affordableCards.length > 0) {
      if (Math.random() < 0.5) {
         const cardToBuy = affordableCards[Math.floor(Math.random() * affordableCards.length)];
         return { type: 'RESPONSE_MARKET', payload: { action: 'buy', cardId: cardToBuy }, __qTransition: transition } as any;
      }
    }
    return { type: 'RESPONSE_MARKET', payload: { action: 'pass' }, __qTransition: transition } as any;
  }

  if (topAction?.type === 'ASK_QUESTION' && topAction.playerId === playerId) {
    if (topAction.payload.message && topAction.payload.message.includes('yield Tokyo')) {
      const stayTokyo = (actionMask & 16) > 0;
      const options = topAction.payload.options as string[];
      let selectedOption = stayTokyo ? options.find(o => o.toLowerCase().includes('stay')) : options.find(o => o.toLowerCase().includes('yield'));
      if (!selectedOption) selectedOption = options[0];
      return { type: 'RESPONSE_QUESTION', payload: { selectedOption }, __qTransition: transition } as any;
    }
    
    // For other questions (like Mimic, etc.), just answer randomly for now
    return getRandomBotAction(state, playerId);
  }

  return getRandomBotAction(state, playerId);
}
