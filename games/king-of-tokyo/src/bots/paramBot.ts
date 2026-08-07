import type { KotAction, KotState } from '../engine/types';
import { getBotAction as getRandomBotAction } from './randomBot';

export function getParamBotAction(state: KotState, playerId: string): KotAction | null {
  const player = state.players[playerId];
  if (!player) return null;

  const topAction = state.pendingActions[0];

  if (topAction?.type === 'ASK_YIELD_TOKYO' && topAction.payload?.prompt?.playerId === playerId) {
     // If we have decent health, stay in Tokyo. Otherwise yield.
     const stay = player.health >= 5;
     const prompt = topAction.payload.prompt;
     const optionLabel = stay ? 'Stay' : 'Yield';
     const opt = prompt.options?.find((o: any) => o.label === optionLabel) || prompt.options?.[0];
     if (opt) return opt.action;
  }

  // We only override ASK_ROLL and ASK_YIELD_TOKYO. Everything else (cards, market) falls back to random bot.
  if (topAction?.type === 'ASK_ROLL' && topAction.payload?.prompt?.playerId === playerId) {
    if (state.rollCount === state.maxRolls) {
       return { type: 'RESPONSE_ROLL', payload: { roll: false } };
    }

    // 1. Determine State Index (0-53)
    const inTokyo = player.location.startsWith('Tokyo') ? 1 : 0;
    
    const aliveCount = state.playerOrder.filter(id => state.players[id].health > 0).length;
    let remGroup = 0;
    if (aliveCount <= 2) remGroup = 0;
    else if (aliveCount <= 4) remGroup = 1;
    else remGroup = 2;

    let hpGroup = 0;
    if (player.health <= 3) hpGroup = 0;
    else if (player.health <= 6) hpGroup = 1;
    else hpGroup = 2;

    let vpGroup = 0;
    if (player.vp <= 9) vpGroup = 0;
    else if (player.vp <= 14) vpGroup = 1;
    else vpGroup = 2;

    const stateIndex = inTokyo * 27 + remGroup * 9 + hpGroup * 3 + vpGroup;

    // 2. Extract strategy from botStrategy string (e.g. "param:[15, 3, 1, ...]")
    let strategyArray: number[] = [];
    try {
        if (player.botStrategy?.startsWith('param:')) {
            strategyArray = JSON.parse(player.botStrategy.substring(6));
        }
    } catch (e) {
        // Fallback to empty
    }
    
    // If malformed or missing, default to strategy 15 (target everything)
    const strategyMask = (strategyArray.length === 54) ? strategyArray[stateIndex] : 15;

    // 3. Decode Strategy Mask
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

  // Fallback for non-roll actions (Market, Yielding Tokyo, Opportunist, etc)
  return getRandomBotAction(state, playerId);
}
