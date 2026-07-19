import type { BaseGameState, BaseAction } from '@erez/boardgame-core';
import { baseReducer, baseInitialState, withBotChatter } from '@erez/boardgame-core';
import type { BasePlayer } from '@erez/boardgame-core';

export type DiceFace = '1' | '2' | '3' | 'Energy' | 'Heart' | 'Smash';

export interface KotDice {
  id: string; // To track them stably in UI
  value: DiceFace;
  kept: boolean;
}

export interface KotPlayer extends BasePlayer {
  health: number;
  vp: number;
  energy: number;
  location: 'Outside' | 'TokyoCity';
  stats: {
    healthHealed: number;
    energyGained: number;
    damageDealt: number;
    playersKilled: number;
  };
  cards: string[];
}

export interface KotHistorySnapshot {
  turnNum: number;
  playerId: string;
  vps: Record<string, number>;
  healths: Record<string, number>;
  tokyoOccupant: string | null;
}

export interface KotState extends BaseGameState<KotPlayer> {
  dice: KotDice[];
  rollCount: number;
  settings: {
    maxHealth: number;
    maxVp: number;
    cardsPerType: number;
    startingEnergy: number;
    activeCards: string[];
  };
  history: KotHistorySnapshot[];
  deck: string[];
  market: string[];
  turnContext: Record<string, any>;
}

export type KotAction = 
  | BaseAction
  | { type: 'ROLL_DICE', payload: { playerId: string, keptDiceIds?: string[] } }
  | { type: 'RESOLVE_DICE', payload: { playerId: string } }
  | { type: 'YIELD_TOKYO', payload: { playerId: string, yield: boolean } }
  | { type: 'BUY_CARD', payload: { playerId: string, cardId: string, marketIndex?: number } }
  | { type: 'SWEEP_MARKET', payload: { playerId: string } }
  | { type: 'END_TURN', payload: { playerId: string } }
  | { type: 'UPDATE_SETTINGS', payload: { maxHealth: number, maxVp: number, cardsPerType: number, startingEnergy: number, activeCards: string[] } }
  | { type: 'USE_HERD_CULLER', payload: { playerId: string, skip?: boolean, faceToChange?: string } }
  | { type: 'USE_HEALING_RAY', payload: { playerId: string, skip?: boolean, targetId?: string } }
  | { type: 'BOT_PLAY', payload: { playerId: string } }
  | { type: 'ADD_LOG', payload: { log: string } }
  | { type: 'CARD_ACTION', payload: { playerId: string; cardId: string; action: string; [key: string]: any } };

export const initialKotState: KotState = {
  ...(baseInitialState as unknown as KotState),
  settings: {
    maxHealth: 10,
    maxVp: 20,
    cardsPerType: 1,
    startingEnergy: 0,
    activeCards: ['acid_attack', 'alien_metabolism', 'alpha_monster']
  },
  deck: [],
  market: [],
  dice: [
    { id: 'd1', value: '1', kept: false },
    { id: 'd2', value: '2', kept: false },
    { id: 'd3', value: '3', kept: false },
    { id: 'd4', value: 'Heart', kept: false },
    { id: 'd5', value: 'Energy', kept: false },
    { id: 'd6', value: 'Smash', kept: false },
  ],
  rollCount: 0,
  turnContext: {},
  history: []
};

export const DICE_FACES: DiceFace[] = ['1', '2', '3', 'Energy', 'Heart', 'Smash'];

export function getPlayerMaxHealth(state: KotState, playerId: string): number {
  const base = state.settings?.maxHealth || 10;
  const player = state.players[playerId];
  if (!player) return base;
  const evenBiggerCount = player.cards.filter(c => c === 'even_bigger').length;
  return base + evenBiggerCount * 2;
}

import { CARD_REGISTRY } from './cards/registry';
import type { CardEvent, CardEventPayload } from './cards/types';

function queueBotActionsIfNeeded(state: KotState): KotState {
  if (state.status !== 'Playing') return state;
  if (state.prompt) {
    const promptedPlayer = state.players[state.prompt.playerId];
    if (promptedPlayer?.isBot) {
      const newActionQueue = [...(state.actionQueue || []), { delayMs: 1500, action: { type: 'BOT_PLAY', payload: { playerId: state.prompt.playerId } } }];
      return { ...state, actionQueue: newActionQueue };
    }
    return state;
  }

  const currentPlayerId = state.playerOrder[state.currentPlayerIndex];
  const player = state.players[currentPlayerId];
  if (!player?.isBot) return state;

  const newActionQueue = [...(state.actionQueue || []), { delayMs: 1500, action: { type: 'BOT_PLAY', payload: { playerId: currentPlayerId } } }];
  const botState = { ...state, actionQueue: newActionQueue };
  
  if (state.rollCount === 0) {
    const msgs = ["RAWR!", "Tokyo will be MINE!", "Feel my wrath!", "Smash everything!"];
    return withBotChatter(botState, currentPlayerId, msgs);
  }
  
  return botState;
}

export function dispatchEvent(state: KotState, event: CardEvent, payload: CardEventPayload): KotState {
  let newState = state;
  for (const pId of state.playerOrder) {
    const player = newState.players[pId];
    if (player.health > 0 && player.cards) {
      for (const cardId of player.cards) {
        const card = CARD_REGISTRY[cardId];
        if (card && card.onEvent) {
          payload.cardOwnerId = pId;
          const modState = card.onEvent(event, payload, newState);
          if (modState) {
            newState = modState;
          }
        }
      }
    }
  }
  return newState;
}

function initDeck(state: KotState): { deck: string[], market: string[] } {
  let deck: string[] = [];
  const activeCards = state.settings?.activeCards || ['acid_attack', 'alien_metabolism', 'alpha_monster'];
  
  for (const cardId of activeCards) {
    const copies = state.settings?.cardsPerType ?? 1;
    for (let i = 0; i < copies; i++) {
      deck.push(cardId);
    }
  }
  
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  const market = deck.splice(0, 3);
  return { deck, market };
}

export function kingOfTokyoReducer(state: KotState, action: KotAction): KotState {
  let newState = baseReducer(state, action) as KotState;
  
  if (newState !== state) {
    if (action.type === 'JOIN_GAME') {
      const playerId = action.payload.playerId;
      const basePlayer = newState.players[playerId];
      if (basePlayer && !('health' in basePlayer)) {
        newState = {
          ...newState,
          players: {
            ...newState.players,
            [playerId]: {
              ...(basePlayer as any),
              health: newState.settings?.maxHealth || 10,
              vp: 0,
              energy: newState.settings?.startingEnergy || 0,
              location: 'Outside',
              cards: [],
              stats: {
                healthHealed: 0,
                energyGained: 0,
                damageDealt: 0,
                playersKilled: 0
              }
            }
          }
        };
      }
    }
    
    if (action.type === 'START_GAME') {
      const { deck, market } = initDeck(newState);
      newState = { 
        ...newState, 
        rollCount: 0,
        turnContext: {},
        prompt: undefined,
        dice: newState.dice.map(d => ({ ...d, kept: false })),
        history: [],
        deck,
        market
      };
      newState = queueBotActionsIfNeeded(newState);
    }
    
    if (action.type === 'NEW_GAME') {
      const resetPlayers: Record<string, KotPlayer> = {};
      Object.keys(newState.players).forEach(pId => {
        resetPlayers[pId] = { 
          ...newState.players[pId], 
          health: newState.settings?.maxHealth || 10,
          vp: 0,
          energy: newState.settings?.startingEnergy || 0,
          location: 'Outside',
          cards: [],
          stats: {
            healthHealed: 0,
            energyGained: 0,
            damageDealt: 0,
            playersKilled: 0
          }
        } as KotPlayer;
      });
      const { deck, market } = initDeck(newState);
      newState = { 
        ...newState, 
        rollCount: 0, 
        players: resetPlayers,
        dice: newState.dice.map(d => ({ ...d, kept: false })),
        history: [],
        deck,
        market
      };
    }

    return newState;
  }

  function pushHistorySnapshot(st: KotState, currentPlayerId: string): KotState {
    const vps: Record<string, number> = {};
    const healths: Record<string, number> = {};
    let tokyoOccupant: string | null = null;
    st.playerOrder.forEach(id => {
      vps[id] = st.players[id].vp;
      healths[id] = st.players[id].health;
      if (st.players[id].location === 'TokyoCity' && st.players[id].health > 0) {
        tokyoOccupant = id;
      }
    });
    return {
      ...st,
      history: [...st.history, {
        turnNum: st.history.length + 1,
        playerId: currentPlayerId,
        vps,
        healths,
        tokyoOccupant
      }]
    };
  }

  function checkGameEnd(st: KotState): KotState {
    if (st.status === 'Finished') return st;

    let aliveCount = 0;
    let aliveWinnerId: string | null = null;
    
    for (const id of st.playerOrder) {
      if (st.players[id].health > 0) {
        aliveCount++;
        aliveWinnerId = id;
      }
    }

    if (aliveCount <= 1) {
      let finalSt = {
        ...st,
        status: 'Finished',
        winnerId: aliveWinnerId || null,
        logs: [...st.logs, `Only one monster left standing!`, '---']
      } as KotState;
      return pushHistorySnapshot(finalSt, st.playerOrder[st.currentPlayerIndex]);
    }

    const vpWinner = st.playerOrder.find(id => st.players[id].vp >= (st.settings?.maxVp || 20));
    if (vpWinner) {
      let finalSt = {
        ...st,
        status: 'Finished',
        winnerId: vpWinner,
        logs: [...st.logs, `🏆 ${st.players[vpWinner].name} reached Max VPs!`, '---']
      } as KotState;
      return pushHistorySnapshot(finalSt, st.playerOrder[st.currentPlayerIndex]);
    }

    return st;
  }

  function advanceTurn(st: KotState): KotState {
    st = checkGameEnd(st);
    if (st.status === 'Finished') return st;

    st = pushHistorySnapshot(st, st.playerOrder[st.currentPlayerIndex]);

    let nextIndex = st.currentPlayerIndex;
    let newLogs = [...st.logs, `---`];

    if (st.turnContext?.freezeTimeActivated) {
      newLogs.push(`${st.players[st.playerOrder[st.currentPlayerIndex]].name} activates Freeze Time to take another turn with one less die!`);
    } else if (st.turnContext?.frenzyTurn) {
      newLogs.push(`${st.players[st.playerOrder[st.currentPlayerIndex]].name} activates Frenzy and takes another turn!`);
    } else {
      do {
        nextIndex = (nextIndex + 1) % st.playerOrder.length;
      } while (st.players[st.playerOrder[nextIndex]].health <= 0);
      newLogs.push(`${st.players[st.playerOrder[nextIndex]].name}'s turn!`);
    }

    let nextPlayerId = st.playerOrder[nextIndex];
    let nextPlayer = st.players[nextPlayerId];
    let newPlayers = { ...st.players };

    if (st.turnContext) {
      delete st.turnContext.freezeTimePenalty;
    }
    
    if (newPlayers[nextPlayerId].health <= 0) {
      return {
        ...st,
        currentPlayerIndex: nextIndex,
      };
    }

    // If starting in Tokyo, gain 2 VP
    const tokyoPlayers = Object.values(newPlayers).filter(p => p.location === 'TokyoCity');
    if (newPlayers[nextPlayerId].location === 'TokyoCity' && tokyoPlayers.length > 0) {
      newPlayers[nextPlayerId] = { ...newPlayers[nextPlayerId], vp: newPlayers[nextPlayerId].vp + 2 };
      newLogs.push(`${nextPlayer.name} starts turn in Tokyo! Gained 2 ⭐`);
    }

    const extraHeadCount = newPlayers[nextPlayerId].cards.filter(c => c === 'extra_head').length;
    if (extraHeadCount > 0) {
      newLogs.push(`${nextPlayer.name} readies their Extra Head!`);
    }
    const totalDice = 6 + extraHeadCount - (st.turnContext?.freezeTimeActivated ? 1 : 0);
    const nextDice = [];
    for (let i = 0; i < totalDice; i++) {
      nextDice.push({ id: Math.random().toString(36).substring(7), value: '1' as any, kept: false });
    }

    return {
      ...st,
      players: newPlayers,
      currentPlayerIndex: nextIndex,
      rollCount: 0,
      turnContext: st.turnContext?.freezeTimeActivated ? { freezeTimePenalty: true } : {},
      prompt: undefined,
      dice: nextDice,
      logs: newLogs
    };
  }

  function enterBuyPhaseOrAdvance(st: KotState, playerId: string): KotState {
    let canBuy = false;
    st.market.forEach(cardId => {
      const card = CARD_REGISTRY[cardId];
      if (card && (!st.players[playerId].cards || !st.players[playerId].cards.includes(cardId))) {
        const payload = { playerId, cardOwnerId: playerId, cost: card.cost };
        dispatchEvent(st, 'BUY_CARD_EVAL', payload);
        if (st.players[playerId].energy >= (payload.cost || 0)) canBuy = true;
      }
    });

    if (canBuy || (st.players[playerId].energy >= 2 && st.deck.length > 0)) {
      st.prompt = {
        playerId,
        text: 'Buy Phase',
        options: [
          ...(st.players[playerId].energy >= 2 && st.deck.length > 0 ? [{ label: 'Sweep (2⚡)', action: { type: 'SWEEP_MARKET', payload: { playerId } } as KotAction }] : []),
          { label: 'End Turn', action: { type: 'END_TURN', payload: { playerId } } as KotAction }
        ]
      };
      return st;
    } else {
      let finalSt = { ...st };
      delete finalSt.prompt;
      return advanceTurn(finalSt);
    }
  }

  function innerReducer(): KotState {
    switch (action.type) {
      case 'UPDATE_SETTINGS': {
        if (state.status !== 'Lobby') return state;
        const newPlayers = { ...state.players };
        Object.keys(newPlayers).forEach(pId => {
          newPlayers[pId] = { 
            ...newPlayers[pId], 
            health: action.payload.maxHealth,
            energy: action.payload.startingEnergy || 0
          };
        });
        return {
          ...state,
          players: newPlayers,
          settings: {
            ...state.settings,
            maxHealth: action.payload.maxHealth,
            maxVp: action.payload.maxVp,
            cardsPerType: action.payload.cardsPerType,
            startingEnergy: action.payload.startingEnergy,
            activeCards: action.payload.activeCards
          }
        };
      }
      case 'ROLL_DICE': {
        if (state.status !== 'Playing') return state;
        if (state.playerOrder[state.currentPlayerIndex] !== action.payload.playerId) return state;

        let finalState = { ...state };
        const player = finalState.players[action.payload.playerId];
        const maxRolls = player.cards.includes('giant_brain') ? 4 : 3;

        if (finalState.rollCount >= maxRolls) return state;

        const extraHeadCount = player.cards.filter(c => c === 'extra_head').length;
        const totalDice = 6 + extraHeadCount - (finalState.turnContext.freezeTimePenalty ? 1 : 0);

        let currentDice = [...finalState.dice];
        if (currentDice.length < totalDice) {
          while (currentDice.length < totalDice) {
            currentDice.push({ id: Math.random().toString(36).substring(7), value: '1', kept: false });
          }
        } else if (currentDice.length > totalDice) {
          currentDice = currentDice.slice(0, totalDice);
        }

        const keptDiceIds = action.payload.keptDiceIds || [];
        const newDice = currentDice.map(d => {
          if (finalState.rollCount > 0 && keptDiceIds.includes(d.id)) {
            return { ...d, kept: true };
          }
          const randomFace = DICE_FACES[Math.floor(Math.random() * DICE_FACES.length)];
          return { ...d, id: Math.random().toString(36).substring(7), value: randomFace, kept: false };
        });

        finalState = {
          ...finalState,
          dice: newDice,
          rollCount: finalState.rollCount + 1
        };

        if (finalState.rollCount >= maxRolls) {
          finalState.actionQueue = [
            ...(finalState.actionQueue || []),
            { delayMs: 1500, action: { type: 'RESOLVE_DICE', payload: { playerId: action.payload.playerId } as any } }
          ];
        }

        return queueBotActionsIfNeeded(finalState);
      }
      case 'BOT_PLAY': {
        const botPlayer = state.players[action.payload.playerId];
        if (!botPlayer || !botPlayer.isBot) return state;
        
        const { runBotStrategy } = require('../bots/botLogic');
        const botAction = runBotStrategy(state, action.payload.playerId, botPlayer.botStrategy || 'random');
        
        if (botAction) {
          return kingOfTokyoReducer(state, botAction);
        }
        return state;
      }
      case 'USE_HERD_CULLER': {
        if (state.status !== 'Playing' || !state.prompt || state.prompt.playerId !== action.payload.playerId) return state;
        let finalState = { ...state };
        delete finalState.prompt;
        finalState.turnContext = { ...finalState.turnContext, herdCullerResolved: true };

        if (!action.payload.skip) {
          const dieIndex = finalState.dice.findIndex(d => d.value === action.payload.faceToChange);
          if (dieIndex !== -1) {
             const newDice = [...finalState.dice];
             newDice[dieIndex] = { ...newDice[dieIndex], value: '1' };
             finalState.dice = newDice;
             const faceLabels: Record<string, string> = { Heart: '❤️', Energy: '⚡', Smash: '💥', '2': '2️⃣', '3': '3️⃣' };
             const changedLabel = faceLabels[action.payload.faceToChange || ''] || action.payload.faceToChange;
             finalState.logs.push(`${finalState.players[action.payload.playerId].name} used Herd Culler to change a ${changedLabel} to a 1️⃣`);
          }
        }
        
        finalState.actionQueue = [
          ...(finalState.actionQueue || []),
          { delayMs: 500, action: { type: 'RESOLVE_DICE', payload: { playerId: action.payload.playerId } as any } }
        ];
        return queueBotActionsIfNeeded(finalState);
      }
      case 'USE_HEALING_RAY': {
        if (state.status !== 'Playing' || !state.prompt || state.prompt.playerId !== action.payload.playerId) return state;
        let finalState = { ...state };
        delete finalState.prompt;
        
        if (action.payload.skip) {
           finalState.turnContext = { ...finalState.turnContext, healingRayResolved: true };
           finalState.actionQueue = [
             ...(finalState.actionQueue || []),
             { delayMs: 500, action: { type: 'RESOLVE_DICE', payload: { playerId: action.payload.playerId } as any } }
           ];
           return queueBotActionsIfNeeded(finalState);
        }

        const target = finalState.players[action.payload.targetId!];
        const healer = finalState.players[action.payload.playerId];
        const energyToSteal = Math.min(2, target.energy);
        
        const dieIndex = finalState.dice.findIndex(d => d.value === 'Heart');
        if (dieIndex !== -1) {
           const newDice = [...finalState.dice];
           newDice.splice(dieIndex, 1);
           finalState.dice = newDice;
        }

        finalState.players[target.id] = { ...target, health: Math.min(state.settings?.maxHealth || 10, target.health + 1), energy: target.energy - energyToSteal };
        finalState.players[healer.id] = { ...healer, energy: healer.energy + energyToSteal };
        
        finalState.logs.push(`${healer.name} used Healing Ray to heal ${target.name} for 1 ❤️ and stole ${energyToSteal} ⚡!`);
        
        finalState.actionQueue = [
          ...(finalState.actionQueue || []),
          { delayMs: 500, action: { type: 'RESOLVE_DICE', payload: { playerId: action.payload.playerId } as any } }
        ];
        return queueBotActionsIfNeeded(finalState);
      }
      case 'RESOLVE_DICE': {
        if (state.status !== 'Playing') return state;
        if (state.playerOrder[state.currentPlayerIndex] !== action.payload.playerId) return state;

        let finalState = dispatchEvent(state, 'BEFORE_RESOLVE_DICE', { playerId: action.payload.playerId });
        if (finalState.prompt) {
          return queueBotActionsIfNeeded(finalState);
        }

        const player = finalState.players[action.payload.playerId];
        const outcomeMap: Record<string, number> = {};
        finalState.dice.forEach(d => { outcomeMap[d.value] = (outcomeMap[d.value] || 0) + 1; });
        
        const outcomeEmojiMap: Record<string, string> = { Heart: '❤️', Energy: '⚡', Smash: '💥', '1': '1️⃣', '2': '2️⃣', '3': '3️⃣' };
        const outcomeStr = finalState.dice.map(d => outcomeEmojiMap[d.value] || d.value).join(' ');
        const logMessage = `${player.name} resolved: ${outcomeStr}`;

        let newHealth = player.health;
        let newVp = player.vp;
        let newEnergy = player.energy;
        let newLogs = [...finalState.logs, logMessage];
        
        const newStats = { ...player.stats };

        // Energy
        if (outcomeMap['Energy']) {
          const hasFriend = player.cards.includes('friend_of_children');
          const energyGain = outcomeMap['Energy'] + (hasFriend ? 1 : 0);
          newEnergy += energyGain;
          newStats.energyGained += energyGain;
          newLogs.push(`${player.name} gained ${energyGain} ⚡` + (hasFriend ? ' (including 1 from Friend of Children)' : ''));
        }

        // Heal
        if (outcomeMap['Heart']) {
          if (finalState.players[action.payload.playerId].location === 'Outside') {
            const maxHealth = getPlayerMaxHealth(finalState, player.id);
            const actualHeal = Math.min(maxHealth - player.health, outcomeMap['Heart']);
            if (actualHeal > 0) {
              newHealth += actualHeal;
              newStats.healthHealed += actualHeal;
              newLogs.push(`${player.name} healed ${actualHeal} ❤️`);
            }
          }
        }

        // Victory Points (1, 2, 3)
        ['1', '2', '3'].forEach(num => {
          const count = outcomeMap[num] || 0;
          if (count >= 3) {
            let gained = parseInt(num) + (count - 3);
            if (num === '1' && player.cards.includes('gourmet')) {
              gained += 2;
              newLogs.push(`${player.name} gets 2 extra ⭐ from Gourmet!`);
            }
            newVp += gained;
            newLogs.push(`${player.name} gained ${gained} ⭐`);
            if (num === '1' && player.cards.includes('freeze_time')) {
              finalState.turnContext.freezeTimeActivated = true;
            }
          }
        });

        const updatedPlayer = { ...player, health: newHealth, vp: newVp, energy: newEnergy, stats: newStats };
        let newPlayers = { ...finalState.players, [player.id]: updatedPlayer };
        let newPrompt = finalState.prompt;

        // Attacking
        let smashCountObj = { smashCount: outcomeMap['Smash'] || 0 };
        
        finalState = {
          ...finalState,
          players: newPlayers,
          logs: newLogs
        };
        
        finalState = dispatchEvent(finalState, 'BEFORE_RESOLVE_ATTACKS', { playerId: player.id, smashCount: smashCountObj });
        const finalSmashCount = smashCountObj.smashCount;

        let damagedSomeone = false;
        if (finalSmashCount > 0) {
          if (player.location === 'Outside') {
            // Attack Tokyo players
            const tokyoPlayers = Object.values(finalState.players).filter(p => p.location === 'TokyoCity' && p.health > 0);
            if (tokyoPlayers.length === 0) {
              finalState.players = {
                ...finalState.players,
                [player.id]: {
                  ...finalState.players[player.id],
                  location: 'TokyoCity',
                  vp: finalState.players[player.id].vp + 1
                }
              };
              finalState.logs.push(`${player.name} entered Tokyo and gained 1 ⭐!`);
            } else {
              tokyoPlayers.forEach(tp => {
                let dmgObj = { damage: finalSmashCount };
                finalState = dispatchEvent(finalState, 'BEFORE_TAKE_DAMAGE', { playerId: tp.id, attackerId: player.id, damage: dmgObj });
                const actualDmg = dmgObj.damage;

                if (actualDmg > 0) {
                  finalState.players = {
                    ...finalState.players,
                    [tp.id]: {
                      ...finalState.players[tp.id],
                      health: Math.max(0, finalState.players[tp.id].health - actualDmg)
                    }
                  };
                  damagedSomeone = true;
                  finalState.players[player.id] = {
                    ...finalState.players[player.id],
                    stats: {
                      ...finalState.players[player.id].stats,
                      damageDealt: finalState.players[player.id].stats.damageDealt + Math.min(tp.health, actualDmg)
                    }
                  };
                  if (finalState.players[tp.id].health === 0) {
                    finalState.players[player.id] = {
                      ...finalState.players[player.id],
                      stats: {
                        ...finalState.players[player.id].stats,
                        playersKilled: finalState.players[player.id].stats.playersKilled + 1
                      }
                    };
                    finalState.logs.push(`💀 ${tp.name} was eliminated!`);
                    finalState = dispatchEvent(finalState, 'MONSTER_DIED', { playerId: player.id, deadPlayerId: tp.id });
                  }
                }
              });
              finalState.logs.push(`${player.name} dealt ${finalSmashCount} 💥 to Tokyo!`);
              
              // Prompt first damaged living Tokyo player to yield
              if (damagedSomeone) {
                const livingTokyoPlayer = tokyoPlayers.find(tp => finalState.players[tp.id].health > 0 && finalState.players[tp.id].health < tp.health); // Only prompt if they actually took damage
                if (livingTokyoPlayer) {
                  newPrompt = {
                  playerId: livingTokyoPlayer.id,
                  text: `Will you yield Tokyo?`,
                  options: [
                    { label: 'Yield', action: { type: 'YIELD_TOKYO', payload: { playerId: livingTokyoPlayer.id, attackerId: player.id } } },
                    { label: 'Stay', action: { type: 'STAY_IN_TOKYO', payload: { playerId: livingTokyoPlayer.id } } }
                  ] as any
                } as any;
                } else if (!tokyoPlayers.find(tp => finalState.players[tp.id].health > 0)) {
                  // All Tokyo players died, automatically enter Tokyo
                  finalState.players = {
                    ...finalState.players,
                    [player.id]: {
                      ...finalState.players[player.id],
                      location: 'TokyoCity',
                      vp: finalState.players[player.id].vp + 1
                    }
                  };
                  finalState.logs.push(`${player.name} entered empty Tokyo and gained 1 ⭐!`);
                }
              }
            }
          } else {
            // Attack Outside players
            Object.values(finalState.players).forEach(p => {
              if (p.location === 'Outside' && p.id !== player.id && p.health > 0) {
                let dmgObj = { damage: finalSmashCount };
                finalState = dispatchEvent(finalState, 'BEFORE_TAKE_DAMAGE', { playerId: p.id, attackerId: player.id, damage: dmgObj });
                const actualDmg = dmgObj.damage;

                if (actualDmg > 0) {
                  finalState.players[p.id].health = Math.max(0, finalState.players[p.id].health - actualDmg);
                  damagedSomeone = true;
                  finalState.players[player.id].stats.damageDealt += Math.min(p.health, actualDmg);
                  if (finalState.players[p.id].health === 0) {
                    finalState.players[player.id].stats.playersKilled += 1;
                    finalState.logs.push(`💀 ${p.name} was eliminated!`);
                    finalState = dispatchEvent(finalState, 'MONSTER_DIED', { playerId: player.id, deadPlayerId: p.id });
                  }
                }
              }
            });
            if (damagedSomeone) {
              finalState.logs.push(`${player.name} dealt ${finalSmashCount} 💥 to everyone outside!`);
            }
          }
        }

        if (damagedSomeone && finalState.players[player.id].cards.includes('fire_breathing')) {
          const order = finalState.playerOrder;
          const N = order.length;
          const attackerIdx = order.indexOf(player.id);
          const neighbors = [order[(attackerIdx - 1 + N) % N], order[(attackerIdx + 1) % N]];
          const uniqueNeighbors = [...new Set(neighbors)].filter(id => id !== player.id);
          
          uniqueNeighbors.forEach(nId => {
            if (finalState.players[nId].health > 0) {
               let dmgObj = { damage: 1 };
               finalState = dispatchEvent(finalState, 'BEFORE_TAKE_DAMAGE', { playerId: nId, attackerId: player.id, damage: dmgObj });
               const actualDmg = dmgObj.damage;
               
               if (actualDmg > 0) {
                 finalState.players[nId].health = Math.max(0, finalState.players[nId].health - actualDmg);
                 finalState.logs.push(`🔥 ${finalState.players[nId].name} takes ${actualDmg} extra damage from ${finalState.players[player.id].name}'s Fire Breathing!`);
                 if (finalState.players[nId].health === 0) {
                    finalState.players[player.id].stats.playersKilled += 1;
                    finalState.logs.push(`💀 ${finalState.players[nId].name} was eliminated!`);
                    finalState = dispatchEvent(finalState, 'MONSTER_DIED', { playerId: player.id, deadPlayerId: nId });
                 }
               }
            }
          });
        }

        finalState.turnContext.damagedSomeoneThisTurn = damagedSomeone;
        finalState = dispatchEvent(finalState, 'AFTER_ATTACK', { playerId: player.id, damagedSomeone });

        if (newPrompt) {
          finalState.prompt = newPrompt;
        } else {
          delete finalState.prompt;
          finalState = enterBuyPhaseOrAdvance(finalState, player.id);
        }

        return queueBotActionsIfNeeded(finalState);
      }
      case 'YIELD_TOKYO': {
        const { playerId, yield: didYield } = action.payload;
        const player = state.players[playerId];
        if (!player || !state.prompt || state.prompt.playerId !== playerId) return state;

        let finalState: KotState = { ...state };
        delete finalState.prompt;

        const attackerId = state.playerOrder[state.currentPlayerIndex];
        const attacker = finalState.players[attackerId];

        if (didYield) {
           finalState.players[playerId].location = 'Outside';
           finalState.players[attackerId].location = 'TokyoCity';
           finalState.players[attackerId].vp += 1;
           finalState.logs = [...finalState.logs, `${player.name} yielded Tokyo!`, `${attacker.name} enters and gains 1 ⭐!`];
           finalState = dispatchEvent(finalState, 'YIELD_TOKYO', { playerId, attackerId });
        } else {
           finalState.logs = [...finalState.logs, `${player.name} stays in Tokyo!`];
        }

        finalState = enterBuyPhaseOrAdvance(finalState, attackerId);
        return queueBotActionsIfNeeded(finalState);
      }
      case 'ADD_LOG': {
        const { log } = action.payload;
        return {
          ...state,
          logs: [...state.logs, log]
        };
      }
      case 'END_TURN': {
        if (state.status !== 'Playing' || !state.prompt || state.prompt.playerId !== action.payload.playerId) return state;
        let finalState = { ...state };
        delete finalState.prompt;
        
        finalState = dispatchEvent(finalState, 'END_TURN', { playerId: action.payload.playerId });
        const player = finalState.players[action.payload.playerId];
        
        if (player.cards.includes('herbivore') && !finalState.turnContext.damagedSomeoneThisTurn) {
          finalState.players[player.id].vp += 1;
          finalState.logs.push(`${player.name} gained 1 ⭐ from Herbivore!`);
        }
        finalState = advanceTurn(finalState);
        return queueBotActionsIfNeeded(finalState);
      }
      case 'SWEEP_MARKET': {
        if (state.status !== 'Playing') return state;
        const player = state.players[action.payload.playerId];
        if (state.playerOrder[state.currentPlayerIndex] !== action.payload.playerId) return state;
        if (player.energy < 2 || state.deck.length === 0) return state;

        let finalState = { ...state };
        finalState.players = { ...finalState.players, [player.id]: { ...player, energy: player.energy - 2 } };
        finalState.logs = [...finalState.logs, `${player.name} paid 2 ⚡ to sweep the market!`];
        
        const newDeck = [...finalState.deck];
        const newMarket = newDeck.splice(0, 3);
        finalState.deck = newDeck;
        finalState.market = newMarket;

        finalState = enterBuyPhaseOrAdvance(finalState, player.id);
        return queueBotActionsIfNeeded(finalState);
      }
      case 'BUY_CARD': {
        if (state.status !== 'Playing' || !state.prompt || state.prompt.playerId !== action.payload.playerId) return state;
        const { playerId, cardId } = action.payload;
        const player = state.players[playerId];
        const card = CARD_REGISTRY[cardId];
        if (!card || !state.market.includes(cardId) || (player.cards && player.cards.includes(cardId))) return state;

        const payloadEval = { playerId: player.id, cardOwnerId: player.id, cost: card.cost };
        dispatchEvent(state, 'BUY_CARD_EVAL', payloadEval);
        
        if (player.energy < (payloadEval.cost || 0)) return state;

        let finalState = { ...state };
        
        const payloadBuy = { playerId: player.id, cardOwnerId: player.id, cardId, cost: card.cost };
        finalState = dispatchEvent(finalState, 'BUY_CARD', payloadBuy);
        
        if (card.onEvent) {
          const modState = card.onEvent('BUY_CARD', payloadBuy, finalState);
          if (modState) finalState = modState;
        }
        
        const finalCost = payloadBuy.cost || 0;
        let newPlayer = { ...finalState.players[player.id], energy: finalState.players[player.id].energy - finalCost };
        
        finalState.logs = [...finalState.logs, `${newPlayer.name} bought ${card.name} for ${finalCost} ⚡!`];

        if (card.type === 'Keep') {
          newPlayer.cards = [...(newPlayer.cards || []), card.id];
        }

        finalState.players = { ...finalState.players, [playerId]: newPlayer };
        
        const newMarket = [...finalState.market];
        const marketIndex = action.payload.marketIndex ?? newMarket.indexOf(cardId);
        const newDeck = [...finalState.deck];
        if (newDeck.length > 0) {
          newMarket[marketIndex] = newDeck.shift()!;
        } else {
          newMarket.splice(marketIndex, 1);
        }
        finalState.market = newMarket;
        finalState.deck = newDeck;

        finalState = enterBuyPhaseOrAdvance(finalState, player.id);
        return queueBotActionsIfNeeded(finalState);
      }
      case 'CARD_ACTION': {
        let finalState = dispatchEvent(state, 'CARD_ACTION', action.payload);
        return queueBotActionsIfNeeded(finalState);
      }
      default:
        return baseReducer(state, action);
    }
  }

  let finalRes = innerReducer();
  if (finalRes.status === 'Playing') {
    finalRes = checkGameEnd(finalRes);
  }
  return finalRes;
}
