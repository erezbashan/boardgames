import { DominionState } from '../engine/types';
import { PlayerAction } from '../engine/actions';
import { getCardDef, Cards } from '../engine/cards';

export interface StageStrategy {
  // Actions + Gardens (single weight across all stages, default = printed cost)
  actions: Record<string, number>;
  // 3 VP cards x 4 stages [Stage A (<0.25), Stage B (<0.50), Stage C (<0.75), Stage D (>=0.75)]
  estate: [number, number, number, number];
  duchy: [number, number, number, number];
  province: [number, number, number, number];
  // 2 Money cards x 4 stages [Stage A, Stage B, Stage C, Stage D]
  silver: [number, number, number, number];
  gold: [number, number, number, number];
}

export function getDefaultStageStrategy(): StageStrategy {
  const actions: Record<string, number> = {};
  for (const card of Object.values(Cards)) {
    if (card.types.includes('ACTION') || card.id === 'gardens') {
      actions[card.id] = card.cost;
    }
  }

  return {
    actions,
    estate: [2, 2, 2, 2],
    duchy: [5, 5, 5, 5],
    province: [8, 8, 8, 8],
    silver: [3, 3, 3, 3],
    gold: [6, 6, 6, 6],
  };
}

export const CHAMPION_STAGE_STRATEGY: StageStrategy = {
  ...getDefaultStageStrategy(),
  actions: {
    ...getDefaultStageStrategy().actions,
    library: 4,
    vassal: 2,
  },
  estate: [2, 2, 2, 2],
  duchy: [5, 5, 5, 5],
  province: [7.5, 8, 8, 8],
  silver: [3, 3, 3.5, 3],
  gold: [6, 6, 6, 6.5],
};


function calculateGameProgress(state: DominionState): number {
  const numPlayers = state.playerOrder.length;
  const lookback = 2 * numPlayers;
  const recent = state.recentBuyingPowers || [];
  const window = recent.slice(-lookback);
  while (window.length < lookback) window.unshift(0);

  let provincesBoughtCount = 0;
  let otherCardsBoughtCount = 0;
  for (const bp of window) {
    if (bp >= 8) provincesBoughtCount++;
    if (bp >= 3 && bp < 8) otherCardsBoughtCount++;
  }

  const provinceRatePerRound = Math.max(0.1, provincesBoughtCount / 2);
  const provincesLeft = state.supply['province'] ?? 8;
  const roundsToDepleteProvinces = provincesLeft / provinceRatePerRound;

  const cardsToEmpty3Piles = 30;
  const otherCardsRatePerRound = Math.max(0.5, otherCardsBoughtCount / 2);
  const roundsToEmptyPiles = (cardsToEmpty3Piles * 2) / otherCardsRatePerRound;

  const estimatedRoundsLeft = Math.min(roundsToDepleteProvinces, roundsToEmptyPiles);
  return Math.max(0, Math.min(1, 1 - (estimatedRoundsLeft / 15)));
}

function getEndGameModifier(state: DominionState, playerId: string, cardId: string): number {
  let emptyPiles = 0;
  for (const id in state.supply) {
    if (state.supply[id] <= 0) emptyPiles++;
  }

  const emptiesProvince = (cardId === 'province' && state.supply['province'] === 1);
  const emptiesThirdPile = (state.supply[cardId] === 1 && emptyPiles === 2);

  if (emptiesProvince || emptiesThirdPile) {
    const me = state.players[playerId];
    const def = getCardDef(cardId);
    const isVP = def.types.includes('VICTORY');
    const vpGain = isVP
      ? (cardId === 'province' ? 6 : cardId === 'duchy' ? 3 : cardId === 'estate' ? 1 : 0)
      : 0;
    const newMeVP = me.victoryPoints + vpGain;

    let isAhead = true;
    for (const pId in state.players) {
      if (pId === playerId) continue;
      if (state.players[pId].victoryPoints >= newMeVP) {
        isAhead = false;
        break;
      }
    }
    return isAhead ? 1000 : -1000;
  }
  return 0;
}

export function getCardScore(cardId: string, stageIdx: number, strat: StageStrategy): number {
  if (cardId === 'estate') return strat.estate[stageIdx];
  if (cardId === 'duchy') return strat.duchy[stageIdx];
  if (cardId === 'province') return strat.province[stageIdx];
  if (cardId === 'silver') return strat.silver[stageIdx];
  if (cardId === 'gold') return strat.gold[stageIdx];
  if (cardId === 'copper' || cardId === 'curse') return 0;
  return strat.actions[cardId] ?? getCardDef(cardId).cost;
}

export function getStageBotAction(state: DominionState, playerId: string, strategy: StageStrategy): PlayerAction | null {
  const isInputPhase = state.pendingActions.length > 0 && state.pendingActions[0].type === 'REQUEST_INPUT';

  if (isInputPhase) {
    const inputReq = state.pendingActions[0] as { type: 'REQUEST_INPUT'; playerId: string; inputType: string; payload?: any };
    if (inputReq.playerId !== playerId) return null;

    if (inputReq.inputType === 'CELLAR_DISCARD') {
      const me = state.players[playerId];
      const junkIds = me.hand
        .filter(c => ['copper', 'estate', 'curse'].includes(c.cardId))
        .map(c => c.id);
      return { type: 'RESOLVE_INPUT', playerId, payload: { discardedIds: junkIds } };
    }

    if (inputReq.inputType === 'CHAPEL_TRASH') {
      const me = state.players[playerId];
      const trashIds = me.hand
        .filter(c => ['curse', 'estate', 'copper'].includes(c.cardId))
        .slice(0, 4)
        .map(c => c.id);
      return { type: 'RESOLVE_INPUT', playerId, payload: { trashedIds: trashIds } };
    }

    if (inputReq.inputType === 'MILITIA_DISCARD') {
      const me = state.players[playerId];
      const excess = me.hand.length - 3;
      if (excess <= 0) return { type: 'RESOLVE_INPUT', playerId, payload: { discardedIds: [] } };
      const sorted = [...me.hand].sort((a, b) => getCardDef(a.cardId).cost - getCardDef(b.cardId).cost);
      return { type: 'RESOLVE_INPUT', playerId, payload: { discardedIds: sorted.slice(0, excess).map(c => c.id) } };
    }

    if (inputReq.inputType === 'POACHER_DISCARD') {
      const me = state.players[playerId];
      const count = inputReq.payload?.count || 1;
      const sorted = [...me.hand].sort((a, b) => getCardDef(a.cardId).cost - getCardDef(b.cardId).cost);
      return { type: 'RESOLVE_INPUT', playerId, payload: { discardedIds: sorted.slice(0, count).map(c => c.id) } };
    }

    if (inputReq.inputType === 'WORKSHOP_GAIN' || inputReq.inputType === 'ARTISAN_GAIN') {
      const maxCost = inputReq.payload?.maxCost || (inputReq.inputType === 'WORKSHOP_GAIN' ? 4 : 5);
      const stageIdx = getStageIndex(calculateGameProgress(state));
      const affordable = Object.keys(state.supply).filter(s => state.supply[s] > 0 && getCardDef(s).cost <= maxCost && s !== 'curse');
      if (affordable.length > 0) {
        affordable.sort((a, b) => getCardScore(b, stageIdx, strategy) - getCardScore(a, stageIdx, strategy));
        return { type: 'RESOLVE_INPUT', playerId, payload: { cardId: affordable[0] } };
      }
      return { type: 'RESOLVE_INPUT', playerId, payload: { cardId: 'silver' } };
    }

    if (inputReq.inputType === 'ARTISAN_TOPDECK') {
      const me = state.players[playerId];
      const sorted = [...me.hand].sort((a, b) => getCardDef(a.cardId).cost - getCardDef(b.cardId).cost);
      return { type: 'RESOLVE_INPUT', playerId, payload: { cardId: sorted[0]?.cardId || 'copper' } };
    }

    if (inputReq.inputType === 'REMODEL_TRASH') {
      const me = state.players[playerId];
      const sorted = [...me.hand].sort((a, b) => getCardDef(a.cardId).cost - getCardDef(b.cardId).cost);
      return { type: 'RESOLVE_INPUT', playerId, payload: { trashedIds: [sorted[0].id] } };
    }

    if (inputReq.inputType === 'TRASH_FOR_MINE') {
      const me = state.players[playerId];
      const silver = me.hand.find(c => c.cardId === 'silver');
      if (silver) return { type: 'RESOLVE_INPUT', playerId, payload: { trashedIds: [silver.id] } };
      const copper = me.hand.find(c => c.cardId === 'copper');
      if (copper) return { type: 'RESOLVE_INPUT', playerId, payload: { trashedIds: [copper.id] } };
      return { type: 'RESOLVE_INPUT', playerId, payload: { trashedIds: [] } };
    }

    if (inputReq.inputType === 'DISCARD_TO_DECK') {
      const p = state.players[playerId];
      const bestInDiscard = [...p.discard].sort((a, b) => getCardDef(b.cardId).cost - getCardDef(a.cardId).cost)[0];
      if (bestInDiscard) {
        return { type: 'RESOLVE_INPUT', playerId, payload: { instanceId: bestInDiscard.id } };
      }
      return { type: 'RESOLVE_INPUT', playerId, payload: { instanceId: '' } };
    }

    if (inputReq.inputType === 'PLAY_VASSAL_ACTION') {
      return { type: 'RESOLVE_INPUT', playerId, payload: { playCard: true } };
    }

    if (inputReq.inputType === 'LIBRARY_KEEP') {
      const me = state.players[playerId];
      const cardId = inputReq.payload?.card?.cardId;
      if (getCardDef(cardId).types.includes('ACTION') && me.actions === 0) {
        return { type: 'RESOLVE_INPUT', playerId, payload: { keep: false } };
      }
      return { type: 'RESOLVE_INPUT', playerId, payload: { keep: true } };
    }

    if (inputReq.inputType === 'SENTRY_ACTIONS') {
      const revealed = inputReq.payload?.revealed || [];
      const trashedIds: string[] = [];
      const discardedIds: string[] = [];
      for (const card of revealed) {
        if (card.cardId === 'curse' || card.cardId === 'copper' || card.cardId === 'estate') {
          trashedIds.push(card.id);
        }
      }
      return { type: 'RESOLVE_INPUT', playerId, payload: { trashedIds, discardedIds } };
    }
  }

  if (state.playerOrder[state.currentPlayerIndex] !== playerId) return null;
  const me = state.players[playerId];

  // ACTION PHASE (as-is)
  if (state.phase === 'ACTION') {
    let playableActions = me.hand.filter(c => getCardDef(c.cardId).types.includes('ACTION'));

    if (me.actions > 0 && playableActions.length > 0) {
      const throneRoom = playableActions.find(c => c.cardId === 'throne_room');
      if (throneRoom && playableActions.length > 1) {
        return { type: 'PLAY_CARD', playerId, instanceId: throneRoom.id };
      }

      playableActions = playableActions.filter(c => c.cardId !== 'throne_room');

      const getActionPriority = (c: any) => {
        const def = getCardDef(c.cardId);
        const desc = def.description.toLowerCase();
        if (desc.includes('+2 actions')) return 1;
        if (desc.includes('+1 action') && desc.includes('+') && desc.includes('card')) return 2;
        if (desc.includes('+1 action')) return 3;
        if (desc.includes('+') && desc.includes('card')) return 4;
        return 5;
      };

      playableActions.sort((a, b) => getActionPriority(a) - getActionPriority(b));

      if (playableActions.length > 0) {
        return { type: 'PLAY_CARD', playerId, instanceId: playableActions[0].id };
      }
    }
    return { type: 'END_PHASE', playerId };
  }

  // BUY PHASE
  if (state.phase === 'BUY') {
    // 1. Play all treasures
    const playableTreasures = me.hand.filter(c => getCardDef(c.cardId).types.includes('TREASURE'));
    if (playableTreasures.length > 0) {
      const sorted = [...playableTreasures].sort((a, b) => getCardDef(b.cardId).cost - getCardDef(a.cardId).cost);
      return { type: 'PLAY_CARD', playerId, instanceId: sorted[0].id };
    }

    // 2. Buy cards using stage-based score evaluation
    if (me.buys > 0) {
      const progress = calculateGameProgress(state);
      const stageIdx = getStageIndex(progress);

      const affordable = Object.keys(state.supply).filter(cardId => {
        if (state.supply[cardId] <= 0) return false;
        const def = getCardDef(cardId);
        if (def.cost > me.coins) return false;
        if (cardId === 'curse' || cardId === 'copper') return false; // Ignore copper and curse
        return true;
      });

      if (affordable.length > 0) {
        const scored = affordable.map(cardId => {
          let score = getCardScore(cardId, stageIdx, strategy);
          const endMod = getEndGameModifier(state, playerId, cardId);
          score += endMod;
          return { cardId, score };
        }).filter(item => item.score > 0);

        if (scored.length > 0) {
          scored.sort((a, b) => b.score - a.score);
          const bestScore = scored[0].score;
          const tiedBest = scored.filter(item => item.score === bestScore);
          const chosen = tiedBest[Math.floor(Math.random() * tiedBest.length)].cardId;
          return { type: 'BUY_CARD', playerId, cardId: chosen };
        }
      }
    }

    return { type: 'END_PHASE', playerId };
  }

  return null;
}

export function getStageIndex(progress: number): number {
  if (progress >= 0.75) return 3; // Stage D
  if (progress >= 0.50) return 2; // Stage C
  if (progress >= 0.25) return 1; // Stage B
  return 0; // Stage A
}
