import { baseReducer } from '@erez/boardgame-core';
import { KotState, KotAction, initialKotState, PendingAction } from './types';
import { ACTION_HANDLERS } from './actions';
import { CARD_REGISTRY } from './cards/registry';
import { getBotAction } from '../bots/botLogic';

function doAction(state: KotState, action: PendingAction): KotState {
  let st = { ...state };
  if (!st.players) return st;

  const pId = action.playerId || st.playerOrder[st.currentPlayerIndex];
  
  if (ACTION_HANDLERS[action.type]) {
    ACTION_HANDLERS[action.type](st, action, pId);
  }

  return st;
}

function handleNextAction(state: KotState): KotState {
  let st = state;
  while (st.pendingActions.length > 0 && st.pendingActions[0].type === 'NOP') {
    st.pendingActions.shift();
  }
  
  if (st.pendingActions.length === 0) return st;
  let topAction = st.pendingActions[0];

  if (topAction.type.startsWith('ASK')) {
     const currentPlayerId = st.playerOrder[st.currentPlayerIndex];
     const isBot = st.players[currentPlayerId]?.isBot;

     if (isBot) {
        st.actionQueue = [...(st.actionQueue || []), { delayMs: 500, action: { type: 'PLAY_BOT' } }];
     }
     return st; // wait for response
  }

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
    
    // Process the action (which might have been replaced or prepended to) immediately
    return handleNextAction(st);
  }
}

function triggerCards(state: KotState, action: PendingAction, hook: 'onPreEvent' | 'onPostEvent'): KotState {
  let st = state;
  st.playerOrder.forEach(pId => {
    if (st.players[pId] && st.players[pId].cards) {
      st.players[pId].cards.forEach(cardId => {
        const card = CARD_REGISTRY[cardId];
        if (card && card[hook]) {
          st = card[hook]!(st, action, pId);
        }
      });
    }
  });
  return st;
}

export function kingOfTokyoReducer(state: KotState = initialKotState, action: KotAction & { gameId?: string }): KotState {
  const gamePrefix = action.gameId ? `[${action.gameId}] ` : '';
  if (action.type !== 'NOP') {
    state = JSON.parse(JSON.stringify(state)); // Deep clone state to prevent optimistic UI mutation leaks
    console.log(`${gamePrefix}INCOMING:`, action.type);
    console.log(`${gamePrefix}BEFORE PENDING:`, state.pendingActions?.map(a => a.type).join(', '));
  }
  
  if (action.type === 'NOP') {
    return handleNextAction(state);
  }
  let st = baseReducer(state, action) as KotState;

  if (action.type === 'START_GAME') {
    st.pendingActions.push({ type: 'START_GAME' });
    st = handleNextAction(st);
    return st;
  }

  if (action.type === 'PLAY_BOT') {
    const pId = st.playerOrder[st.currentPlayerIndex];
    if (st.pendingActions.length > 0) {
       const botResponse = getBotAction(st, pId);
       if (botResponse) {
          // Remove the ASK action that prompted the bot!
          if (st.pendingActions[0].type.startsWith('ASK')) {
            st.pendingActions.shift();
          }
          st.pendingActions.unshift({ ...botResponse, playerId: pId });
       }
    }
  }

  if (action.type.startsWith('RESPONSE_')) {
    if (st.pendingActions.length > 0 && st.pendingActions[0].type.startsWith('ASK')) {
      const askAction = st.pendingActions[0];
      if (askAction.payload?.prompt?.playerId === action.playerId) {
         st.pendingActions.shift(); // pop the ASK
         st.pendingActions.unshift({ type: action.type, payload: action.payload, playerId: action.playerId }); // push the response
      }
    }
  }


  const finalState = handleNextAction(st);
  if (action.type !== 'NOP') {
    console.log(`${gamePrefix}AFTER PENDING:`, finalState.pendingActions?.map(a => a.type).join(', '));
  }
  return finalState;
}

export * from './types';
