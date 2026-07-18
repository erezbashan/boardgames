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
    activeCards: string[];
  };
  history: KotHistorySnapshot[];
  deck: string[];
  market: string[];
}

export type KotAction = 
  | BaseAction
  | { type: 'ROLL_DICE', payload: { playerId: string, keptDiceIds?: string[] } }
  | { type: 'RESOLVE_DICE', payload: { playerId: string } }
  | { type: 'BOT_PLAY', payload: { playerId: string } }
  | { type: 'YIELD_TOKYO', payload: { playerId: string, attackerId: string } }
  | { type: 'STAY_IN_TOKYO', payload: { playerId: string } }
  | { type: 'UPDATE_SETTINGS', payload: { maxHealth: number, maxVp: number, cardsPerType: number, activeCards: string[] } }
  | { type: 'BUY_CARD', payload: { playerId: string, cardId: string } }
  | { type: 'SWEEP_MARKET', payload: { playerId: string } }
  | { type: 'END_TURN', payload: { playerId: string } };

export const initialKotState: KotState = {
  ...(baseInitialState as unknown as KotState),
  settings: {
    maxHealth: 10,
    maxVp: 20,
    cardsPerType: 1,
    activeCards: ['acid_attack', 'alien_metabolism', 'alpha_monster']
  },
  deck: [],
  market: [],
  dice: [
    { id: 'd1', value: '1', kept: false },
    { id: 'd2', value: '2', kept: false },
    { id: 'd3', value: '3', kept: false },
    { id: 'd4', value: 'Energy', kept: false },
    { id: 'd5', value: 'Heart', kept: false },
    { id: 'd6', value: 'Smash', kept: false },
  ],
  rollCount: 0,
  history: []
};

const DICE_FACES: DiceFace[] = ['1', '2', '3', 'Energy', 'Heart', 'Smash'];

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
  const copies = state.settings?.cardsPerType || 1;
  const activeCards = state.settings?.activeCards || ['acid_attack', 'alien_metabolism', 'alpha_monster'];
  
  for (const cardId of activeCards) {
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
              energy: 0,
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
          energy: 0,
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
    do {
      nextIndex = (nextIndex + 1) % st.playerOrder.length;
    } while (st.players[st.playerOrder[nextIndex]].health <= 0);

    return {
      ...st,
      currentPlayerIndex: nextIndex,
      rollCount: 0,
      dice: st.dice.map(d => ({ ...d, kept: false })),
      logs: [...st.logs, '---']
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

    if (st.players[playerId].energy >= 2 || canBuy) {
      const options = [{ label: "End Turn", action: { type: 'END_TURN', payload: { playerId } } as any }];
      if (st.players[playerId].energy >= 2) {
         options.unshift({ label: "Sweep (2⚡)", action: { type: 'SWEEP_MARKET', payload: { playerId } } as any });
      }
      return {
        ...st,
        prompt: {
          playerId,
          text: `Buy Phase`,
          options
        }
      };
    } else {
      let finalSt = { ...st };
      delete finalSt.prompt;
      return advanceTurn(finalSt);
    }
  }

  switch (action.type) {
    case 'UPDATE_SETTINGS': {
      if (state.status !== 'Lobby') return state;
      const newPlayers = { ...state.players };
      Object.keys(newPlayers).forEach(pId => {
        // Clamp current health to the new maxHealth so we don't accidentally max out an injured player's health if this is triggered mid-game
        // In lobby they should ideally be fully healed, so we just set it to maxHealth.
        newPlayers[pId] = { ...newPlayers[pId], health: action.payload.maxHealth };
      });
      return {
        ...state,
        players: newPlayers,
        settings: {
          ...state.settings,
          maxHealth: action.payload.maxHealth,
          maxVp: action.payload.maxVp,
          cardsPerType: action.payload.cardsPerType,
          activeCards: action.payload.activeCards
        }
      };
    }
    case 'ROLL_DICE': {
      if (state.status !== 'Playing') return state;
      if (state.playerOrder[state.currentPlayerIndex] !== action.payload.playerId) return state;
      if (state.rollCount >= 3) return state;

      let finalState = { ...state };

      if (state.rollCount === 0) {
        const p = finalState.players[action.payload.playerId];
        if (p.location === 'TokyoCity' && p.health > 0) {
          finalState.players = {
            ...finalState.players,
            [p.id]: { ...p, vp: p.vp + 2 }
          };
          finalState.logs = [...finalState.logs, `${p.name} starts turn in Tokyo! Gained 2 ⭐`];
          finalState = checkGameEnd(finalState);
          if (finalState.status === 'Finished') return finalState;
        }
      }

      const keptDiceIds = action.payload.keptDiceIds || [];
      const newDice = finalState.dice.map(d => {
        if (finalState.rollCount > 0 && keptDiceIds.includes(d.id)) {
          return { ...d, kept: true };
        }
        const randomFace = DICE_FACES[Math.floor(Math.random() * DICE_FACES.length)];
        return { ...d, value: randomFace, kept: false };
      });

      finalState = {
        ...finalState,
        dice: newDice,
        rollCount: finalState.rollCount + 1
      };

      if (finalState.rollCount >= 3) {
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
    case 'RESOLVE_DICE': {
      if (state.status !== 'Playing') return state;
      if (state.playerOrder[state.currentPlayerIndex] !== action.payload.playerId) return state;

      const player = state.players[action.payload.playerId];
      const outcomeMap: Record<string, number> = {};
      state.dice.forEach(d => { outcomeMap[d.value] = (outcomeMap[d.value] || 0) + 1; });
      
      const outcomeEmojiMap: Record<string, string> = { Heart: '❤️', Energy: '⚡', Smash: '💥', '1': '1️⃣', '2': '2️⃣', '3': '3️⃣' };
      const outcomeStr = state.dice.map(d => outcomeEmojiMap[d.value] || d.value).join(' ');
      const logMessage = `${player.name} resolved: ${outcomeStr}`;

      let newHealth = player.health;
      let newVp = player.vp;
      let newEnergy = player.energy;
      let newLogs = [...state.logs, logMessage];
      
      const newStats = { ...player.stats };

      // Energy
      if (outcomeMap['Energy']) {
        newEnergy += outcomeMap['Energy'];
        newStats.energyGained += outcomeMap['Energy'];
        newLogs.push(`${player.name} gained ${outcomeMap['Energy']} ⚡`);
      }

      // Healing (only if Outside Tokyo)
      if (outcomeMap['Heart'] && player.location === 'Outside') {
        const maxHealth = state.settings?.maxHealth || 10;
        const actualHeal = Math.min(maxHealth - player.health, outcomeMap['Heart']);
        if (actualHeal > 0) {
          newHealth += actualHeal;
          newStats.healthHealed += actualHeal;
          newLogs.push(`${player.name} healed ${actualHeal} ❤️`);
        }
      }

      // VPs for numbers
      ['1', '2', '3'].forEach(num => {
        const count = outcomeMap[num] || 0;
        if (count >= 3) {
          const gained = parseInt(num) + (count - 3);
          newVp += gained;
          newLogs.push(`${player.name} gained ${gained} ⭐`);
        }
      });

      const updatedPlayer = { ...player, health: newHealth, vp: newVp, energy: newEnergy, stats: newStats };
      let newPlayers = { ...state.players, [player.id]: updatedPlayer };
      let newPrompt = state.prompt;

      // Attacking
      let smashCountObj = { smashCount: outcomeMap['Smash'] || 0 };
      
      // Fire BEFORE_RESOLVE_ATTACKS to allow cards like Acid Attack to modify smashCountObj.smashCount
      let finalState: KotState = {
        ...state,
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
            finalState.players[player.id].location = 'TokyoCity';
            finalState.players[player.id].vp += 1;
            finalState.logs.push(`${player.name} entered Tokyo and gained 1 ⭐!`);
          } else {
            tokyoPlayers.forEach(tp => {
              finalState.players[tp.id].health = Math.max(0, finalState.players[tp.id].health - finalSmashCount);
              damagedSomeone = true;
              finalState.players[player.id].stats.damageDealt += Math.min(tp.health, finalSmashCount);
              if (finalState.players[tp.id].health === 0) {
                finalState.players[player.id].stats.playersKilled += 1;
                finalState.logs.push(`💀 ${tp.name} was eliminated!`);
              }
            });
            finalState.logs.push(`${player.name} dealt ${finalSmashCount} 💥 to Tokyo!`);
            
            // Prompt first damaged living Tokyo player to yield
            if (damagedSomeone) {
              const livingTokyoPlayer = tokyoPlayers.find(tp => finalState.players[tp.id].health > 0);
              if (livingTokyoPlayer) {
                newPrompt = {
                  playerId: livingTokyoPlayer.id,
                  text: `Will you yield Tokyo?`,
                  options: [
                    { label: 'Yield', action: { type: 'YIELD_TOKYO', payload: { playerId: livingTokyoPlayer.id, attackerId: player.id } } },
                    { label: 'Stay', action: { type: 'STAY_IN_TOKYO', payload: { playerId: livingTokyoPlayer.id } } }
                  ]
                };
              } else {
                // All Tokyo players died, automatically enter Tokyo
                finalState.players[player.id].location = 'TokyoCity';
                finalState.players[player.id].vp += 1;
                finalState.logs.push(`${player.name} entered empty Tokyo and gained 1 ⭐!`);
              }
            }
          }
        } else {
          // Attack Outside players
          Object.values(finalState.players).forEach(p => {
            if (p.location === 'Outside' && p.id !== player.id && p.health > 0) {
              finalState.players[p.id].health = Math.max(0, finalState.players[p.id].health - finalSmashCount);
              damagedSomeone = true;
              finalState.players[player.id].stats.damageDealt += Math.min(p.health, finalSmashCount);
              if (finalState.players[p.id].health === 0) {
                finalState.players[player.id].stats.playersKilled += 1;
                finalState.logs.push(`💀 ${p.name} was eliminated!`);
              }
            }
          });
          if (damagedSomeone) {
            finalState.logs.push(`${player.name} dealt ${finalSmashCount} 💥 to everyone outside!`);
          }
        }
      }

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
      const { playerId, attackerId } = action.payload;
      const player = state.players[playerId];
      const attacker = state.players[attackerId];
      if (!player || !attacker || !state.prompt || state.prompt.playerId !== playerId) return state;

      const newPlayers = { ...state.players };
      newPlayers[playerId].location = 'Outside';
      newPlayers[attackerId].location = 'TokyoCity';
      newPlayers[attackerId].vp += 1;

      let finalState: KotState = {
        ...state,
        players: newPlayers,
        logs: [...state.logs, `${player.name} yielded Tokyo!`, `${attacker.name} enters and gains 1 ⭐!`]
      };
      delete finalState.prompt;
      finalState = enterBuyPhaseOrAdvance(finalState, attackerId);
      
      return queueBotActionsIfNeeded(finalState);
    }
    case 'STAY_IN_TOKYO': {
      const { playerId } = action.payload;
      const player = state.players[playerId];
      if (!player || !state.prompt || state.prompt.playerId !== playerId) return state;

      let finalState: KotState = {
        ...state,
        logs: [...state.logs, `${player.name} stays in Tokyo!`]
      };
      delete finalState.prompt;
      
      // The attacker is the one who caused the prompt. We can get attackerId from the previous active player (the current player)
      const attackerId = state.playerOrder[state.currentPlayerIndex];
      finalState = enterBuyPhaseOrAdvance(finalState, attackerId);
      
      return queueBotActionsIfNeeded(finalState);
    }
    case 'END_TURN': {
      if (state.status !== 'Playing' || !state.prompt || state.prompt.playerId !== action.payload.playerId) return state;
      let finalState = { ...state };
      delete finalState.prompt;
      finalState = advanceTurn(finalState);
      return queueBotActionsIfNeeded(finalState);
    }
    case 'SWEEP_MARKET': {
      if (state.status !== 'Playing' || !state.prompt || state.prompt.playerId !== action.payload.playerId) return state;
      const player = state.players[action.payload.playerId];
      if (player.energy < 2) return state;

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
      
      const finalCost = payloadBuy.cost || 0;
      let newPlayer = { ...finalState.players[player.id], energy: finalState.players[player.id].energy - finalCost };
      
      finalState.logs = [...finalState.logs, `${newPlayer.name} bought ${card.name} for ${finalCost} ⚡!`];

      if (card.type === 'Keep') {
        newPlayer.cards = [...(newPlayer.cards || []), card.id];
      }

      finalState.players = { ...finalState.players, [playerId]: newPlayer };
      
      const newMarket = [...finalState.market];
      const marketIndex = newMarket.indexOf(cardId);
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
    default:
      return baseReducer(state, action);
  }
}
