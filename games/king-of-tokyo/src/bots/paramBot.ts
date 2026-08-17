import type { KotAction, KotState, KotPlayer } from '../engine/types';
import { getBotAction as getRandomBotAction } from './randomBot';
import { CARD_REGISTRY } from '../engine/cards/registry';

export function getStateIndex(player: KotPlayer, state: KotState): number {
  const inTokyo = player.location.startsWith('Tokyo') ? 1 : 0;
  
  let hpGroup = 0;
  if (player.health <= 3) hpGroup = 0;
  else if (player.health <= 6) hpGroup = 1;
  else hpGroup = 2;

  let vpGroup = 0;
  if (player.vp <= 9) vpGroup = 0;
  else if (player.vp <= 14) vpGroup = 1;
  else vpGroup = 2;

  // New: Player count group (0: 2 players, 1: 3-4 players, 2: 5-6 players)
  const numPlayers = Object.keys(state.players).length;
  let playerGroup = 0;
  if (numPlayers === 2) playerGroup = 0;
  else if (numPlayers <= 4) playerGroup = 1;
  else playerGroup = 2;

  // 3 * 2 * 3 * 3 = 54 combinations
  // playerGroup (3) * inTokyo (2) * hpGroup (3) * vpGroup (3)
  return playerGroup * 18 + inTokyo * 9 + hpGroup * 3 + vpGroup;
}

function getStrategyMask(player: KotPlayer, state: KotState): number {
  let strategyArray: number[] = [];
  try {
      if (player.botStrategy?.startsWith('param:')) {
          strategyArray = JSON.parse(player.botStrategy.substring(6));
      }
  } catch (e) {}
  
  if (strategyArray.length === 54) {
      return strategyArray[getStateIndex(player, state)];
  }
  return 15; // default
}

export function getParamBotAction(state: KotState, playerId: string): KotAction | null {
  const player = state.players[playerId];
  if (!player) return null;

  const topAction = state.pendingActions[0];

  if (topAction?.type === 'ASK_ROLL' && topAction.payload?.prompt?.playerId === playerId) {
    const strategyMask = getStrategyMask(player, state);

    // Decode Strategy Mask
    const targetAttack = (strategyMask & 1) > 0;
    const targetHealth = (strategyMask & 2) > 0;
    const targetEnergy = (strategyMask & 4) > 0;
    const targetPoints = (strategyMask & 8) > 0;

    const keptIds: string[] = [];
    let unlockedCount = state.dice.length;
    const rerollsLeft = (state.maxRolls || 3) - (state.rollCount || 0);

    // Pass 1: Direct Keepers (Attack, Health, Energy)
    state.dice.forEach(d => {
       let keep = false;
       if (d.value === 'Smash' && targetAttack) keep = true;
       else if (d.value === 'Heart' && targetHealth) keep = true;
       else if (d.value === 'Energy' && targetEnergy) keep = true;

       if (keep) {
           keptIds.push(d.id);
           unlockedCount--;
       }
    });

    // Pass 2: Points Logic
    if (targetPoints) {
       const counts: Record<string, number> = { '1': 0, '2': 0, '3': 0 };
       state.dice.forEach(d => {
           if (!keptIds.includes(d.id) && (d.value === '1' || d.value === '2' || d.value === '3')) {
               counts[d.value]++;
           }
       });

       const keepValues = new Set<string>();
       
       if (counts['1'] >= 3) keepValues.add('1');
       if (counts['2'] >= 3) keepValues.add('2');
       if (counts['3'] >= 3) keepValues.add('3');

       const diceRerollsLeft = rerollsLeft * unlockedCount;

       if (counts['3'] === 2 && diceRerollsLeft >= 4) keepValues.add('3');
       if (counts['2'] === 2 && diceRerollsLeft >= 6) keepValues.add('2');

       state.dice.forEach(d => {
           if (!keptIds.includes(d.id) && keepValues.has(d.value)) {
               keptIds.push(d.id);
               unlockedCount--;
           }
       });
    }

    return { type: 'RESPONSE_ROLL', payload: { roll: true, keptDiceIds: keptIds } };
  }

  // Handle Yield Tokyo using the 16 bit
  if (topAction?.type === 'ASK' && topAction.payload?.prompt?.playerId === playerId) {
    if (topAction.payload.prompt.text && topAction.payload.prompt.text.includes('yield Tokyo')) {
      const strategyMask = getStrategyMask(player, state);
      const stayTokyo = (strategyMask & 16) > 0;
      
      const options = topAction.payload.prompt.options as any[];
      if (stayTokyo && options.some(o => o.label === 'Stay')) {
        return options.find(o => o.label === 'Stay').action;
      } else if (!stayTokyo && options.some(o => o.label === 'Yield')) {
        return options.find(o => o.label === 'Yield').action;
      }
    }
  }

  // Handle Market
  if (topAction?.type === 'ASK_MARKET' && topAction.payload?.prompt?.playerId === playerId) {
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
      // Pick a random affordable card to buy
      const toBuy = affordableCards[Math.floor(Math.random() * affordableCards.length)];
      return { type: 'RESPONSE_MARKET', payload: { action: 'BUY', cardId: toBuy.cardId, marketIndex: toBuy.index } };
    }
    
    // Never Sweep
    return { type: 'RESPONSE_MARKET', payload: { action: 'DONE' } };
  }

  // Fallback for non-roll actions (Questions, Opportunist, etc)
  return getRandomBotAction(state, playerId);
}
