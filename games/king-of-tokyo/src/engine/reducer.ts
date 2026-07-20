import type { BaseGameState, BaseAction, BasePlayer } from '@erez/boardgame-core';
import { baseReducer, baseInitialState } from '@erez/boardgame-core';

export type DiceFace = '1' | '2' | '3' | 'Energy' | 'Heart' | 'Smash';

export interface KotDice {
  id: string;
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

export interface PendingAction {
  type: string;
  payload?: any;
  playerId?: string;
  skipPreEvent?: boolean;
  affectedByCards?: { cardId: string, playerId: string }[];
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
  deck: string[];
  market: string[];
  turnContext: Record<string, any>;
  pendingActions: PendingAction[];
  logs: string[];
  history: any[];
  prompt?: any; // To keep UI happy temporarily
}

export type KotAction = BaseAction | any;

export const initialKotState: KotState = {
  ...(baseInitialState as unknown as KotState),
  settings: {
    maxHealth: 10,
    maxVp: 20,
    cardsPerType: 1,
    startingEnergy: 0,
    activeCards: []
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
  pendingActions: [],
  logs: [],
  history: []
};

export const DICE_FACES: DiceFace[] = ['1', '2', '3', 'Energy', 'Heart', 'Smash'];

export function getPlayerMaxHealth(state: KotState, playerId: string): number {
  return state.settings?.maxHealth || 10;
}

export function kingOfTokyoReducer(state: KotState, action: KotAction): KotState {
  let newState = baseReducer(state, action) as KotState;
  
  if (newState !== state) {
    if (action.type === 'START_GAME') {
      newState = { 
        ...newState, 
        rollCount: 0,
        turnContext: {},
        deck: [], // TODO: init real deck
        market: [],
        pendingActions: [{ type: 'START_TURN', playerId: newState.playerOrder[newState.currentPlayerIndex] }],
        logs: ['Game Started!']
      };
      return handleNextAction(newState);
    }
    return newState;
  }

  // Intercept UI responses
  newState = { ...state, pendingActions: [...(state.pendingActions || [])] };
  const top = newState.pendingActions[0];

  if (top) {
    if (top.type === 'ASK_ROLL') {
      if (action.type === 'ROLL_DICE') {
        newState.pendingActions.shift();
        newState.pendingActions.unshift({ type: 'RESPONSE_ROLL', payload: { roll: true, keptDiceIds: action.payload.keptDiceIds } });
        return handleNextAction(newState);
      }
      if (action.type === 'RESOLVE_DICE') {
        newState.pendingActions.shift();
        newState.pendingActions.unshift({ type: 'RESPONSE_ROLL', payload: { roll: false } });
        return handleNextAction(newState);
      }
    }
    if (top.type === 'ASK_MARKET') {
      if (action.type === 'END_TURN') {
        newState.pendingActions.shift();
        newState.pendingActions.unshift({ type: 'RESPONSE_MARKET', payload: { action: 'DONE' } });
        return handleNextAction(newState);
      }
      if (action.type === 'BUY_CARD') {
        newState.pendingActions.shift();
        newState.pendingActions.unshift({ type: 'RESPONSE_MARKET', payload: { action: 'BUY', cardId: action.payload.cardId, marketIndex: action.payload.marketIndex } });
        return handleNextAction(newState);
      }
      if (action.type === 'SWEEP_MARKET') {
        newState.pendingActions.shift();
        newState.pendingActions.unshift({ type: 'RESPONSE_MARKET', payload: { action: 'SWEEP' } });
        return handleNextAction(newState);
      }
    }
    if (top.type === 'ASK') {
       if (action.type === 'CARD_ACTION' || action.type === 'YIELD_TOKYO' || action.type === 'STAY_IN_TOKYO') {
          newState.pendingActions.shift();
          // Assume the UI action directly provides the next action steps, or just prepend the raw action
          newState.pendingActions.unshift({ type: 'RESPONSE_ASK', payload: action });
          return handleNextAction(newState);
       }
    }
  }

  // Generic fallback if not handled
  if (action.type === 'UPDATE_SETTINGS') {
    return { ...newState, settings: { ...newState.settings, ...action.payload } };
  }

  return newState; // Or handleNextAction? For now just return
}

function handleNextAction(state: KotState): KotState {
  if (!state.pendingActions || state.pendingActions.length === 0) return state;
  let st = { ...state, pendingActions: [...state.pendingActions] };

  while (st.pendingActions.length > 0 && st.pendingActions[0].type === 'NOP') {
    st.pendingActions.shift();
  }
  
  if (st.pendingActions.length === 0) return st;
  let topAction = st.pendingActions[0];

  if (topAction.type === 'PLAY_BOT') {
    st.pendingActions.shift();
    if (st.pendingActions.length > 0) {
       // Minimal random bot
       const nextAction = st.pendingActions[0];
       if (nextAction.type === 'ASK_ROLL') {
         st.actionQueue = [...(st.actionQueue || []), { delayMs: 1000, action: { type: 'RESOLVE_DICE' } }];
       } else if (nextAction.type === 'ASK_MARKET') {
         st.actionQueue = [...(st.actionQueue || []), { delayMs: 1000, action: { type: 'END_TURN' } }];
       } else if (nextAction.type === 'ASK') {
         // handle yield vs stay
         st.actionQueue = [...(st.actionQueue || []), { delayMs: 1000, action: { type: 'STAY_IN_TOKYO' } }];
       }
    }
    return st;
  }

  if (topAction.type.startsWith('ASK')) {
     const currentPlayerId = st.playerOrder[st.currentPlayerIndex];
     const isBot = st.players[currentPlayerId]?.isBot;
     
     // Setup UI prompts
     if (topAction.type === 'ASK_ROLL') {
        st.prompt = { playerId: currentPlayerId, text: 'Roll Dice?' };
     } else if (topAction.type === 'ASK_MARKET') {
        st.prompt = { playerId: currentPlayerId, text: 'Buy Cards?' };
     } else if (topAction.type === 'ASK') {
        st.prompt = topAction.payload.prompt;
     }

     if (isBot) {
        st.actionQueue = [...(st.actionQueue || []), { delayMs: 1500, action: { type: 'PLAY_BOT' } }];
     }
     return st; // wait for response
  }

  st.prompt = undefined; // clear prompt if we're not asking

  if (topAction.skipPreEvent) {
    st.pendingActions.shift();
    st = doAction(st, topAction);
    st = triggerCards(st, topAction, 'onPostEvent');
    
    // We schedule a TICK to let client animate/see the state
    st.actionQueue = [...(st.actionQueue || []), { delayMs: 500, action: { type: 'NOP' } }];
    return st;
  } else {
    st.pendingActions[0] = { ...topAction, skipPreEvent: true };
    st = triggerCards(st, st.pendingActions[0], 'onPreEvent');
    
    // Process the action (which might have been replaced or prepended to) immediately, 
    // or wait for TICK. Let's process immediately so we don't need 2 ticks per action.
    return handleNextAction(st);
  }
}

import { CARD_REGISTRY } from './cards/registry';

function triggerCards(state: KotState, action: PendingAction, hook: 'onPreEvent' | 'onPostEvent'): KotState {
  let st = state;
  st.playerOrder.forEach(pId => {
    const p = st.players[pId];
    if (p && p.cards) {
      p.cards.forEach(cId => {
        const card = CARD_REGISTRY[cId];
        if (card && card[hook]) {
           st = card[hook]!(st, action);
        }
      });
    }
  });
  return st;
}

function doAction(state: KotState, action: PendingAction): KotState {
  let st = { ...state };
  const currentPlayerId = st.playerOrder[st.currentPlayerIndex];
  const pId = action.playerId || currentPlayerId;

  switch(action.type) {
    case 'START_TURN': {
      st.logs = [...st.logs, '---'];
      const p = st.players[pId];
      st.pendingActions = [
        { type: 'SETUP_DICE' },
        { type: 'ASK_ROLL' },
        { type: 'RESOLVE_ROLLS' },
        { type: 'GO_TO_MARKER' },
        { type: 'END_TURN' },
        ...st.pendingActions
      ];
      if (p && p.location === 'TokyoCity') {
        st.logs = [...st.logs, `${p.name} starts turn in Tokyo!`];
        st.pendingActions.unshift({ type: 'VP', payload: { amount: 2 }, playerId: pId });
      }
      break;
    }
    case 'SETUP_DICE': {
      st.dice = st.dice.map(d => ({ ...d, kept: false, value: '1' }));
      st.rollCount = 3;
      break;
    }
    case 'RESPONSE_ROLL': {
      if (action.payload.roll) {
        st.dice = st.dice.map(d => action.payload.keptDiceIds?.includes(d.id) ? d : { ...d, value: DICE_FACES[Math.floor(Math.random() * DICE_FACES.length)] });
        st.rollCount -= 1;
        if (st.rollCount > 0) {
          st.pendingActions.unshift({ type: 'ASK_ROLL' });
        } else {
          st.pendingActions.unshift({ type: 'RESOLVE_ROLLS' });
        }
      }
      break;
    }
    case 'RESOLVE_ROLLS': {
      const outcomeMap: Record<string, number> = {};
      st.dice.forEach(d => { outcomeMap[d.value] = (outcomeMap[d.value] || 0) + 1; });
      const diceActions: PendingAction[] = [];
      
      const emojiMap: Record<string, string> = { Heart: '❤️', Energy: '⚡', Smash: '💥', '1': '1️⃣', '2': '2️⃣', '3': '3️⃣' };
      const outcomeStr = st.dice.map(d => emojiMap[d.value] || d.value).join(' ');
      st.logs = [...st.logs, `${st.players[pId].name} resolved: ${outcomeStr}`];

      if (outcomeMap['Heart']) diceActions.push({ type: 'HEALTH', payload: { amount: outcomeMap['Heart'] }, playerId: pId });
      if (outcomeMap['Energy']) diceActions.push({ type: 'ENERGY', payload: { amount: outcomeMap['Energy'] }, playerId: pId });
      ['1', '2', '3'].forEach(num => {
        const count = outcomeMap[num] || 0;
        if (count >= 3) {
          diceActions.push({ type: 'VP', payload: { amount: parseInt(num) + (count - 3) }, playerId: pId });
        }
      });
      if (outcomeMap['Smash']) diceActions.push({ type: 'ATTACK', payload: { damage: outcomeMap['Smash'] }, playerId: pId });
      
      st.pendingActions = [...diceActions, ...st.pendingActions];
      break;
    }
    case 'VP': {
      if (st.players[pId]) {
        st.players[pId] = { ...st.players[pId], vp: st.players[pId].vp + action.payload.amount };
        st.logs = [...st.logs, `${st.players[pId].name} gained ${action.payload.amount} ⭐`];
        if (st.players[pId].vp >= st.settings.maxVp) {
          st.logs = [...st.logs, `${st.players[pId].name} wins on VP! 🏆`];
          st.status = 'Finished';
        }
      }
      break;
    }
    case 'ENERGY': {
       if (st.players[pId]) {
         st.players[pId] = { ...st.players[pId], energy: st.players[pId].energy + action.payload.amount };
         st.logs = [...st.logs, `${st.players[pId].name} gained ${action.payload.amount} ⚡`];
       }
       break;
    }
    case 'HEALTH': {
      if (st.players[pId]) {
        const max = getPlayerMaxHealth(st, pId);
        const actual = Math.min(max - st.players[pId].health, action.payload.amount);
        if (actual > 0 && st.players[pId].location !== 'TokyoCity') {
          st.players[pId] = { ...st.players[pId], health: st.players[pId].health + actual };
          st.logs = [...st.logs, `${st.players[pId].name} healed ${actual} ❤️`];
        }
      }
      break;
    }
    case 'TAKE_DAMAGE': {
      const targetId = pId;
      const dmg = action.payload.amount;
      if (st.players[targetId] && st.players[targetId].health > 0) {
         const newHealth = Math.max(0, st.players[targetId].health - dmg);
         st.players[targetId] = { ...st.players[targetId], health: newHealth };
         st.logs = [...st.logs, `${st.players[targetId].name} took ${dmg} 💥`];
         if (newHealth === 0) {
            st.pendingActions.unshift({ type: 'DEAD', playerId: targetId });
         }
      }
      break;
    }
    case 'DEAD': {
       st.logs = [...st.logs, `💀 ${st.players[pId].name} was eliminated!`];
       const alive = st.playerOrder.filter(id => st.players[id].health > 0);
       if (alive.length <= 1) {
          st.logs = [...st.logs, `${st.players[alive[0]].name} is the last monster standing! 🏆`];
          st.status = 'Finished';
       }
       break;
    }
    case 'ATTACK': {
      const attacker = st.players[pId];
      const damage = action.payload.damage;
      let damagedSomeone = false;

      const actionsToPush: PendingAction[] = [];

      if (attacker.location === 'Outside') {
         const tokyoPlayers = st.playerOrder.filter(id => st.players[id].location === 'TokyoCity' && st.players[id].health > 0);
         if (tokyoPlayers.length === 0) {
            actionsToPush.push({ type: 'ENTER_TOKYO', playerId: pId });
         } else {
            tokyoPlayers.forEach(tId => {
               actionsToPush.push({ type: 'TAKE_DAMAGE', payload: { amount: damage }, playerId: tId });
            });
            actionsToPush.push({ type: 'ASK', payload: { 
               prompt: {
                 playerId: tokyoPlayers[0],
                 text: `Will you yield Tokyo?`,
                 options: [
                   { label: 'Yield', action: { type: 'YIELD_TOKYO', payload: { playerId: tokyoPlayers[0], attackerId: pId } } },
                   { label: 'Stay', action: { type: 'STAY_IN_TOKYO', payload: { playerId: tokyoPlayers[0] } } }
                 ]
               }
            }});
         }
      } else {
         st.playerOrder.forEach(id => {
            if (st.players[id].location === 'Outside' && st.players[id].health > 0) {
               actionsToPush.push({ type: 'TAKE_DAMAGE', payload: { amount: damage }, playerId: id });
            }
         });
      }
      
      // We must push the ASK last so it executes last among the pushed actions (i.e., put it at the bottom of these)
      // Actually, unshift pushes to front. We want the order: TAKE_DAMAGE, TAKE_DAMAGE, then ASK.
      // So we reverse the array and unshift.
      st.pendingActions = [...actionsToPush, ...st.pendingActions];
      break;
    }
    case 'RESPONSE_ASK': {
      // Handles yield
      const subAction = action.payload;
      if (subAction.type === 'YIELD_TOKYO') {
         const { playerId, attackerId } = subAction.payload;
         st.players[playerId] = { ...st.players[playerId], location: 'Outside' };
         st.logs = [...st.logs, `${st.players[playerId].name} yielded Tokyo!`];
         st.pendingActions.unshift({ type: 'ENTER_TOKYO', playerId: attackerId });
      } else if (subAction.type === 'STAY_IN_TOKYO') {
         st.logs = [...st.logs, `${st.players[subAction.payload.playerId].name} stays in Tokyo!`];
      }
      break;
    }
    case 'ENTER_TOKYO': {
      st.players[pId] = { ...st.players[pId], location: 'TokyoCity' };
      st.logs = [...st.logs, `${st.players[pId].name} enters Tokyo!`];
      st.pendingActions.unshift({ type: 'VP', payload: { amount: 1 }, playerId: pId });
      break;
    }
    case 'GO_TO_MARKER': {
      st.pendingActions = [
        { type: 'SETUP_CARD_PRICES' },
        { type: 'BUY_OR_SWEEP' },
        ...st.pendingActions
      ];
      break;
    }
    case 'SETUP_CARD_PRICES': {
      // For now, prices are static. 
      break;
    }
    case 'BUY_OR_SWEEP': {
      const canSweep = st.players[pId].energy >= 2;
      const canPurchase = true; // simplifying for now
      if (canSweep || canPurchase) {
         st.pendingActions.unshift({ type: 'ASK_MARKET' });
      }
      break;
    }
    case 'RESPONSE_MARKET': {
      if (action.payload.action === 'DONE') {
         // do nothing, let it advance
      } else if (action.payload.action === 'SWEEP') {
         st.pendingActions = [
           { type: 'SWEEP', playerId: pId },
           { type: 'GO_TO_MARKER', playerId: pId },
           ...st.pendingActions
         ];
      } else if (action.payload.action === 'BUY') {
         st.pendingActions = [
           { type: 'BUY', payload: action.payload, playerId: pId },
           { type: 'GO_TO_MARKER', playerId: pId },
           ...st.pendingActions
         ];
      }
      break;
    }
    case 'SWEEP': {
      st.players[pId].energy -= 2;
      st.logs = [...st.logs, `${st.players[pId].name} paid 2 ⚡ to sweep the market!`];
      const newDeck = [...st.deck];
      st.market = newDeck.splice(0, 3);
      st.deck = newDeck;
      break;
    }
    case 'BUY': {
      // Not fully implemented without cards, just deduct cost and put in array
      const cardId = action.payload.cardId;
      st.logs = [...st.logs, `${st.players[pId].name} bought a card! (Not fully implemented)`];
      break;
    }
    case 'END_TURN': {
      st.currentPlayerIndex = (st.currentPlayerIndex + 1) % st.playerOrder.length;
      if (st.players[st.playerOrder[st.currentPlayerIndex]].health <= 0) {
         st.pendingActions.unshift({ type: 'END_TURN' }); // skip dead
      } else {
         st.pendingActions.unshift({ type: 'START_TURN', playerId: st.playerOrder[st.currentPlayerIndex] });
      }
      break;
    }
  }
  
  return st;
}
