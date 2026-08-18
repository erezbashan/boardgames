import type { KotAction, KotState, KotPlayer } from '../engine/types';
import { getBotAction as getRandomBotAction } from './randomBot';
import { CARD_REGISTRY } from '../engine/cards/registry';

interface RuleBotConfig {
  vp: number; // Play for points if my points >= vp
  en: number; // Play for energy if my points <= en
  hl: number; // Play for health if my health <= hl
  at: number; // Play for attack if sum of other active targets <= at
  yd: number; // Yield Tokyo if my health <= yd
}

export function parseRuleConfig(botStrategy: string, playersLeft: number = 2): RuleBotConfig | null {
  let targetSegment = botStrategy;
  if (botStrategy.includes('|')) {
    const segments = botStrategy.split('|').map(s => s.trim());
    targetSegment = segments[0]; // default to first
    for (const segment of segments) {
      if (segment.startsWith(`${playersLeft}P:`)) {
        targetSegment = segment.substring(segment.indexOf(':') + 1).trim();
        break;
      }
    }
  }

  if (targetSegment.startsWith('rule:')) {
    try {
      return JSON.parse(targetSegment.substring(5));
    } catch (e) {
      return null;
    }
  } else if (targetSegment.includes('VP:')) {
    try {
      const matchVP = targetSegment.match(/VP:\s*(\d+)/i);
      const matchEN = targetSegment.match(/EN:\s*(\d+)/i);
      const matchHL = targetSegment.match(/HL:\s*(\d+)/i);
      const matchAT = targetSegment.match(/AT:\s*(\d+)/i);
      const matchYD = targetSegment.match(/YD:\s*(\d+)/i);
      if (matchVP && matchEN && matchHL && matchAT && matchYD) {
        return {
          vp: parseInt(matchVP[1], 10),
          en: parseInt(matchEN[1], 10),
          hl: parseInt(matchHL[1], 10),
          at: parseInt(matchAT[1], 10),
          yd: parseInt(matchYD[1], 10)
        };
      }
    } catch (e) {
      return null;
    }
  }
  return null;
}

export function getRuleBotAction(state: KotState, playerId: string): KotAction | null {
  const player = state.players[playerId];
  if (!player) return null;

  const playersLeft = Object.values(state.players).filter(p => p.health > 0).length;

  const topAction = state.pendingActions[0];
  const config = parseRuleConfig(player.botStrategy || '', playersLeft);
  if (!config) return getRandomBotAction(state, playerId);

  const inTokyo = player.location.startsWith('Tokyo');

  if (topAction?.type === 'ASK_ROLL' && topAction.payload?.prompt?.playerId === playerId) {
    const playPoints = player.vp >= config.vp;
    const playEnergy = player.vp < config.en;
    const playHealth = player.health <= config.hl && !inTokyo;

    const sumActive = (playPoints ? 1 : 0) + (playEnergy ? 1 : 0) + (playHealth ? 1 : 0);
    const playAttack = sumActive <= config.at;

    const keptIds: string[] = [];
    let unlockedCount = state.dice.length;
    const rerollsLeft = (state.maxRolls || 3) - (state.rollCount || 0);

    // Keep direct targets
    state.dice.forEach(d => {
      let keep = false;
      if (d.value === 'Smash' && playAttack) keep = true;
      else if (d.value === 'Heart' && playHealth) keep = true;
      else if (d.value === 'Energy' && playEnergy) keep = true;

      if (keep) {
        keptIds.push(d.id);
        unlockedCount--;
      }
    });

    // Keep points if playing points
    if (playPoints) {
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

      // Smart keeping for pairs
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

  if (topAction?.type === 'ASK' && topAction.payload?.prompt?.playerId === playerId) {
    if (topAction.payload.prompt.text && topAction.payload.prompt.text.includes('yield Tokyo')) {
      const yieldTokyo = player.health <= config.yd;
      
      const options = topAction.payload.prompt.options as any[];
      if (!yieldTokyo && options.some(o => o.label === 'Stay')) {
        return options.find(o => o.label === 'Stay').action;
      } else if (yieldTokyo && options.some(o => o.label === 'Yield')) {
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
        if (cardDef.type === 'Keep' && player.cards.includes(c.cardId)) return false;
        let cost = cardDef.cost;
        if (player.cards.includes('alien_metabolism') || player.cards.includes('alienMetabolism')) {
            cost = Math.max(0, cost - 1);
        }
        return energy >= cost;
    });

    if (affordableCards.length > 0) {
      const toBuy = affordableCards[Math.floor(Math.random() * affordableCards.length)];
      return { type: 'RESPONSE_MARKET', payload: { action: 'BUY', cardId: toBuy.cardId, marketIndex: toBuy.index } };
    }
    
    return { type: 'RESPONSE_MARKET', payload: { action: 'DONE' } };
  }

  return getRandomBotAction(state, playerId);
}
