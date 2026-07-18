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
}

export interface KotState extends BaseGameState<KotPlayer> {
  dice: KotDice[];
  rollCount: number;
  settings: {
    maxHealth: number;
    maxVp: number;
  };
}

export type KotAction = 
  | BaseAction
  | { type: 'ROLL_DICE', payload: { playerId: string, keptDiceIds?: string[] } }
  | { type: 'RESOLVE_DICE', payload: { playerId: string } }
  | { type: 'BOT_PLAY', payload: { playerId: string } }
  | { type: 'YIELD_TOKYO', payload: { playerId: string, attackerId: string } }
  | { type: 'STAY_IN_TOKYO', payload: { playerId: string } }
  | { type: 'UPDATE_SETTINGS', payload: { maxHealth: number, maxVp: number } };

export const initialKotState: KotState = {
  ...(baseInitialState as unknown as KotState),
  settings: {
    maxHealth: 10,
    maxVp: 20
  },
  dice: [
    { id: 'd1', value: '1', kept: false },
    { id: 'd2', value: '2', kept: false },
    { id: 'd3', value: '3', kept: false },
    { id: 'd4', value: 'Energy', kept: false },
    { id: 'd5', value: 'Heart', kept: false },
    { id: 'd6', value: 'Smash', kept: false },
  ],
  rollCount: 0
};

const DICE_FACES: DiceFace[] = ['1', '2', '3', 'Energy', 'Heart', 'Smash'];

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
              location: 'Outside'
            }
          }
        };
      }
    }
    
    if (action.type === 'START_GAME') {
      newState = { 
        ...newState, 
        rollCount: 0,
        dice: newState.dice.map(d => ({ ...d, kept: false }))
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
          location: 'Outside'
        } as KotPlayer;
      });
      newState = { 
        ...newState, 
        rollCount: 0, 
        players: resetPlayers,
        dice: newState.dice.map(d => ({ ...d, kept: false }))
      };
    }

    return newState;
  }

  switch (action.type) {
    case 'UPDATE_SETTINGS': {
      if (state.status !== 'Lobby') return state;
      return {
        ...state,
        settings: {
          ...state.settings,
          maxHealth: action.payload.maxHealth,
          maxVp: action.payload.maxVp
        }
      };
    }
    case 'ROLL_DICE': {
      if (state.status !== 'Playing') return state;
      if (state.playerOrder[state.currentPlayerIndex] !== action.payload.playerId) return state;
      if (state.rollCount >= 3) return state;

      const keptDiceIds = action.payload.keptDiceIds || [];

      const newDice = state.dice.map(d => {
        if (state.rollCount > 0 && keptDiceIds.includes(d.id)) {
          return { ...d, kept: true };
        }
        const randomFace = DICE_FACES[Math.floor(Math.random() * DICE_FACES.length)];
        return { ...d, value: randomFace, kept: false };
      });

      let finalState = {
        ...state,
        dice: newDice,
        rollCount: state.rollCount + 1
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
      // Must import botLogic lazily or at top. We will import at top.
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
      const outcomeStr = Object.entries(outcomeMap).map(([face, count]) => `${count}x ${outcomeEmojiMap[face] || face}`).join(', ');
      const logMessage = `${player.name} resolved: ${outcomeStr}.`;

      let newHealth = player.health;
      let newVp = player.vp;
      let newEnergy = player.energy;
      
      // Energy
      if (outcomeMap['Energy']) {
        newEnergy += outcomeMap['Energy'];
      }

      // Healing (only if Outside Tokyo)
      if (outcomeMap['Heart'] && player.location === 'Outside') {
        const maxHealth = state.settings?.maxHealth || 10;
        newHealth = Math.min(maxHealth, newHealth + outcomeMap['Heart']);
      }

      // VPs for numbers
      ['1', '2', '3'].forEach(num => {
        const count = outcomeMap[num] || 0;
        if (count >= 3) {
          newVp += parseInt(num) + (count - 3);
        }
      });

      const updatedPlayer = { ...player, health: newHealth, vp: newVp, energy: newEnergy };
      let newPlayers = { ...state.players, [player.id]: updatedPlayer };
      let newLogs = [...state.logs, logMessage];
      let newPrompt = state.prompt;

      // Attacking
      const smashCount = outcomeMap['Smash'] || 0;
      if (smashCount > 0) {
        if (player.location === 'Outside') {
          // Attack Tokyo players
          const tokyoPlayers = Object.values(newPlayers).filter(p => p.location === 'TokyoCity');
          if (tokyoPlayers.length === 0) {
            // Enter Tokyo empty
            newPlayers[player.id].location = 'TokyoCity';
            newPlayers[player.id].vp += 1;
            newLogs.push(`${player.name} entered Tokyo and gained 1 VP!`);
          } else {
            // Damage Tokyo players
            let damagedSomeone = false;
            tokyoPlayers.forEach(tp => {
              newPlayers[tp.id].health = Math.max(0, newPlayers[tp.id].health - smashCount);
              damagedSomeone = true;
            });
            newLogs.push(`${player.name} dealt ${smashCount} 💥 to Tokyo!`);
            
            // Check if anyone died
            // (Handling death is omitted for brevity, let's assume they don't die instantly or we'll handle it later)
            
            // Prompt first damaged Tokyo player to yield
            if (damagedSomeone) {
              const damagedTp = tokyoPlayers[0];
              newPrompt = {
                playerId: damagedTp.id,
                text: `${player.name} dealt ${smashCount} 💥. Will you yield Tokyo?`,
                options: [
                  { label: 'Yield', action: { type: 'YIELD_TOKYO', payload: { playerId: damagedTp.id, attackerId: player.id } } },
                  { label: 'Stay', action: { type: 'STAY_IN_TOKYO', payload: { playerId: damagedTp.id } } }
                ]
              };
            }
          }
        } else {
          // Attack Outside players
          let damagedSomeone = false;
          Object.values(newPlayers).forEach(p => {
            if (p.location === 'Outside' && p.id !== player.id) {
              newPlayers[p.id].health = Math.max(0, newPlayers[p.id].health - smashCount);
              damagedSomeone = true;
            }
          });
          if (damagedSomeone) {
            newLogs.push(`${player.name} dealt ${smashCount} 💥 to everyone outside!`);
          }
        }
      }

      let finalState: KotState = {
        ...state,
        rollCount: 0,
        players: newPlayers,
        dice: state.dice.map(d => ({ ...d, kept: false })),
        logs: newLogs
      };

      if (newPrompt) {
        finalState.prompt = newPrompt;
      } else {
        delete finalState.prompt;
        finalState.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.playerOrder.length;
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

      const finalState: KotState = {
        ...state,
        players: newPlayers,
        logs: [...state.logs, `${player.name} yielded Tokyo! ${attacker.name} enters and gains 1 VP!`],
        currentPlayerIndex: (state.currentPlayerIndex + 1) % state.playerOrder.length
      };
      delete finalState.prompt;
      
      return queueBotActionsIfNeeded(finalState);
    }
    case 'STAY_IN_TOKYO': {
      const { playerId } = action.payload;
      const player = state.players[playerId];
      if (!player || !state.prompt || state.prompt.playerId !== playerId) return state;

      const finalState: KotState = {
        ...state,
        logs: [...state.logs, `${player.name} stays in Tokyo!`],
        currentPlayerIndex: (state.currentPlayerIndex + 1) % state.playerOrder.length
      };
      delete finalState.prompt;
      
      return queueBotActionsIfNeeded(finalState);
    }
    default:
      return baseReducer(state, action);
  }
}
