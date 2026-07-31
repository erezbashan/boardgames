import { baseReducer } from '@erez/boardgame-core';
import { KotState, KotAction, initialKotState, PendingAction } from './types';
import { ACTION_HANDLERS } from './actions';
import { CARD_REGISTRY } from './cards/registry';
import { MARKER_REGISTRY } from './markers/registry';
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

  if (topAction.type === 'MULTIPLE_ACTIONS' || topAction.type === 'RESPONSE_MULTIPLE_ACTIONS') {
     st.pendingActions.shift();
     st.pendingActions = [...topAction.payload.actions, ...st.pendingActions];
     return handleNextAction(st);
  }

  if (topAction.type.startsWith('ASK')) {
     const promptPlayerId = topAction.payload?.prompt?.playerId || topAction.playerId || st.playerOrder[st.currentPlayerIndex];
     const isBot = st.players[promptPlayerId]?.isBot;

     if (isBot) {
        st.actionQueue = [...(st.actionQueue || []), { delayMs: 1500, action: { type: 'PLAY_BOT' } }];
     }
     return st; // wait for response
  }

  if (topAction.skipPreEvent) {
    st.pendingActions.shift();
    const initialLogCount = st.logs.length;
    st = doAction(st, topAction);
    st = triggerCards(st, topAction, 'onPostEvent');
    
    if (st.logs.length > initialLogCount) {
      // We schedule a TICK to let client animate/see the state
      st.actionQueue = [...(st.actionQueue || []), { delayMs: 1500, action: { type: 'NOP' } }];
      return st;
    } else {
      return handleNextAction(st);
    }
  } else {
    st.pendingActions[0] = { ...topAction, skipPreEvent: true };
    st = triggerCards(st, st.pendingActions[0], 'onPreEvent');
    
    // Process the action (which might have been replaced or prepended to) immediately
    return handleNextAction(st);
  }
}

function triggerCards(state: KotState, action: PendingAction, hook: 'onPreEvent' | 'onPostEvent'): KotState {
  let st = state;
  const startIndex = st.currentPlayerIndex || 0;
  const orderedPlayers = [
    ...st.playerOrder.slice(startIndex),
    ...st.playerOrder.slice(0, startIndex)
  ];

  orderedPlayers.forEach(pId => {
    if (st.players[pId] && st.players[pId].cards) {
      const cardsToCheck = [...st.players[pId].cards];
      cardsToCheck.forEach(cardId => {
        // Ensure player still has the card (it wasn't discarded by a previous card's hook)
        if (!st.players[pId].cards.includes(cardId)) return;
        
        const card = CARD_REGISTRY[cardId];
        if (card && card[hook]) {
          const preLength = st.pendingActions.length;
          st = card[hook]!(st, action, pId);
          const addedCount = st.pendingActions.length - preLength;
          if (addedCount > 0) {
             for (let i = 0; i < addedCount; i++) {
                if (!st.pendingActions[i].affectedByCards) {
                   st.pendingActions[i] = {
                      ...st.pendingActions[i],
                      affectedByCards: [{ cardId, playerId: pId }]
                   };
                }
             }
          }
        }
      });
    }

    if (st.players[pId] && st.players[pId].markers) {
      Object.keys(st.players[pId].markers || {}).forEach(markerId => {
         const count = st.players[pId].markers![markerId];
         if (count > 0) {
            const marker = MARKER_REGISTRY[markerId];
            if (marker && marker[hook]) {
               st = marker[hook]!(st, action, pId);
            }
         }
      });
    }
  });
  return st;
}

export function kingOfTokyoReducer(state: KotState = initialKotState, action: KotAction & { gameId?: string }): KotState {
  const gamePrefix = action.gameId ? `[${action.gameId}]` : '';
  state = JSON.parse(JSON.stringify(state)); // Deep clone state to prevent optimistic UI mutation leaks
  if (action.type !== 'NOP') {
    console.log(`kingOfTokyoReducer ${gamePrefix} INCOMING:`, action.type);
    console.log(`kingOfTokyoReducer ${gamePrefix} PENDING:`, state.pendingActions?.map(a => a.type).join(', '));
  }
  
  // run framework commands if any:
  let st = baseReducer(state, action) as KotState;

  if (action.type === 'NOP') {
    // no need to do anything - we'll just run what's already in pendingActions
  }
  else if (action.type === 'START_GAME') {
    st.pendingActions.push({ type: 'START_GAME' });
  }
  else if (action.type === 'UPDATE_SETTINGS') {
    st.settings = action.payload;
    // Also apply startingEnergy to all current players in the lobby
    st.playerOrder.forEach(pId => {
      if (st.players[pId]) {
        st.players[pId].energy = st.settings.startingEnergy || 0;
      }
    });
    return st; // Return immediately to avoid pushing to pendingActions
  }
  else if (action.type === 'PLAY_BOT') {
    // this is for when we went to sleep before a bot needed to decide on something
    if (st.pendingActions.length > 0) {
       const topAction = st.pendingActions[0];
       const targetPlayerId = topAction.payload?.prompt?.playerId || topAction.playerId || st.playerOrder[st.currentPlayerIndex];
       
       const botResponse = getBotAction(st, targetPlayerId);
       if (botResponse) {
          // Remove the ASK action that prompted the bot!
          if (st.pendingActions[0].type.startsWith('ASK')) {
            st.pendingActions.shift();
          }
          st.pendingActions.unshift({ ...botResponse, playerId: targetPlayerId });
       }
    }
  }
  else if (action.type.startsWith('RESPONSE_')) {
    if (st.pendingActions.length > 0 && st.pendingActions[0].type.startsWith('ASK')) {
      const askAction = st.pendingActions[0];
      if (askAction.payload?.prompt?.playerId === action.playerId) {
         st.pendingActions.shift(); // pop the ASK
         st.pendingActions.unshift({ type: action.type, payload: action.payload, playerId: action.playerId }); // push the response
      }
    }
  }

  return handleNextAction(st);
}

export * from './types';
