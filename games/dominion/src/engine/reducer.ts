import { baseReducer } from '@erez/boardgame-core';
import { getBotAction } from '../bot/registry';
import { DominionState, PendingAction, CardInstance, Phase, PlayerState } from './types';
import { PlayerAction } from './actions';

import { getCardDef } from './cards';

function recalculateVP(state: DominionState) {
  Object.values(state.players).forEach((p: any) => {
    let vp = 0;
    const allCards = [...p.deck, ...p.discard, ...p.hand, ...p.playArea];
    allCards.forEach(c => {
      const def = getCardDef(c.cardId);
      if (def.name === 'Estate') vp += 1;
      if (def.name === 'Duchy') vp += 3;
      if (def.name === 'Province') vp += 6;
      if (def.name === 'Curse') vp -= 1;
    });
    p.victoryPoints = vp;
  });
}

import { shuffle, generateInstanceId } from './utils';

function createInitialDeck(): CardInstance[] {
  const deck: CardInstance[] = [];
  for (let i = 0; i < 7; i++) deck.push({ id: generateInstanceId('copper'), cardId: 'copper' });
  for (let i = 0; i < 3; i++) deck.push({ id: generateInstanceId('estate'), cardId: 'estate' });
  return shuffle(deck);
}

function processPendingActions(state: DominionState) {
  let processing = true;
  while (processing && state.pendingActions.length > 0) {
    const currentAction = state.pendingActions[0]; // Peek
    
    if (currentAction.type === 'REQUEST_INPUT') {
      processing = false;
      break; // Pause engine for input
    }

    const pending = state.pendingActions.shift() as PendingAction;
    const player = state.players[pending.playerId];
    
    switch (pending.type) {
      case 'DRAW_CARDS': {
        let amountToDraw = pending.amount;
        while (amountToDraw > 0) {
          if (player.deck.length === 0) {
            if (player.discard.length === 0) break; // Can't draw anymore
            player.deck = shuffle([...player.discard]);
            player.discard = [];
            state.logs.push(`${player.name} shuffles their discard pile.`);
          }
          const card = player.deck.pop();
          if (card) player.hand.push(card);
          amountToDraw--;
        }
        break;
      }
      case 'GAIN_ACTIONS':
        player.actions += pending.amount;
        break;
      case 'GAIN_BUYS':
        player.buys += pending.amount;
        break;
      case 'GAIN_COINS':
        player.coins += pending.amount;
        break;
      case 'SHUFFLE_DISCARD':
        player.deck = shuffle([...player.deck, ...player.discard]);
        player.discard = [];
        break;
    }
  }
}

import { DominionAction } from './actions';

function checkBotTurn(state: DominionState): DominionState {
  if (state.status !== 'Playing') return state;

  let activePlayerId = state.playerOrder[state.currentPlayerIndex];
  if (state.pendingActions.length > 0 && state.pendingActions[0].type === 'REQUEST_INPUT') {
    activePlayerId = state.pendingActions[0].playerId;
  }
  
  const player = state.players[activePlayerId];
  if (player && player.isBot) {
    if (!state.actionQueue) state.actionQueue = [];
    if (!state.actionQueue.some(a => a.action.type === 'PLAY_BOT')) {
      state.actionQueue.push({ delayMs: 1000, action: { type: 'PLAY_BOT' } });
    }
  }
  
  return state;
}


function autoPlayTreasures(state: DominionState, playerId: string) {
  const player = state.players[playerId];
  const treasures = player.hand.filter((c: any) => getCardDef(c.cardId).types.includes('TREASURE'));
  if (treasures.length > 0) {
    treasures.forEach((t: any) => {
      player.hand = player.hand.filter((c: any) => c.id !== t.id);
      player.playArea.push(t);
      const def = getCardDef(t.cardId);
      if (def.onPlay) {
        state.pendingActions.push(...def.onPlay(state, playerId));
      }
    });
    state.logs.push(`-- ${player.name} auto-plays ${treasures.length} treasures --`);
  }
}

export function dominionReducer
(state: DominionState, action: DominionAction): DominionState {
  // First run through the baseReducer to handle JOIN_GAME, START_GAME, etc.
  let nextState = baseReducer(state, action as any) as DominionState;
  
  // Now deep clone for our own mutations to be safe
  nextState = JSON.parse(JSON.stringify(nextState));

  switch (action.type) {
    case 'JOIN_GAME': {
      const pid = (action as any).payload.playerId;
      if (nextState.players[pid] && !nextState.players[pid].deck) {
        nextState.players[pid] = {
          ...nextState.players[pid],
          deck: [],
          hand: [],
          playArea: [],
          discard: [],
          actions: 0,
          buys: 0,
          coins: 0,
          victoryPoints: 0
        };
      }
      break;
    }
  
    case 'PLAY_ALL_TREASURES': {
      if (nextState.status !== 'Playing') break;
      if (nextState.phase !== 'BUY') break;
      if (nextState.playerOrder[nextState.currentPlayerIndex] !== action.playerId) break;

      const player = nextState.players[action.playerId];
      const treasures = player.hand.filter((c: any) => getCardDef(c.cardId).types.includes('TREASURE'));
      if (treasures.length > 0) {
        treasures.forEach((t: any) => {
          player.hand = player.hand.filter((c: any) => c.id !== t.id);
          player.playArea.push(t);
          const def = getCardDef(t.cardId);
          if (def.onPlay) {
            nextState.pendingActions.push(...def.onPlay(nextState, action.playerId));
          }
        });
        nextState.logs.push(`-- ${player.name} plays all treasures --`);
      }
      break;
    }
    case 'PLAY_BOT': {
      if (nextState.status !== 'Playing') break;
      let targetPlayerId = nextState.playerOrder[nextState.currentPlayerIndex];
      if (nextState.pendingActions.length > 0 && nextState.pendingActions[0].type === 'REQUEST_INPUT') {
        targetPlayerId = nextState.pendingActions[0].playerId;
      }
      const player = nextState.players[targetPlayerId];
      if (!player || !player.isBot) break;

      const botAction = getBotAction(nextState, targetPlayerId);
      if (botAction) {
        return dominionReducer(nextState, botAction);
      }
      break;
    }

    case 'START_GAME': {
      // Basic initialization (hardcoded supply for now)
      nextState.supply = {
        copper: 60, silver: 40, gold: 30,
        estate: 24, duchy: 12, province: 12, curse: 30,
        village: 10, smithy: 10, woodcutter: 10, cellar: 10,
        market: 10, festival: 10, laboratory: 10,
        council_room: 10, moat: 10, bazaar: 10
      };
      
      Object.values(nextState.players).forEach(p => {
        p.deck = createInitialDeck();
        p.hand = [];
        p.discard = [];
        p.playArea = [];
        nextState.pendingActions.push({ type: 'DRAW_CARDS', playerId: p.id, amount: 5 });
      });
      nextState.currentPlayerIndex = 0;
      nextState.phase = 'ACTION';
      const firstPlayerId = nextState.playerOrder[0];

      const firstPlayer = nextState.players[firstPlayerId];
      nextState.logs.push(`-- ${firstPlayer.name}'s turn starts --`);
      nextState.players[firstPlayerId].actions = 1;
      nextState.players[firstPlayerId].buys = 1;
      nextState.status = 'Playing';
      break;
    }
    case 'PLAY_CARD': {
      const player = nextState.players[action.playerId];
      if (nextState.playerOrder[nextState.currentPlayerIndex] !== action.playerId) break; // Not their turn
      
      const cardIndex = player.hand.findIndex(c => c.id === action.instanceId);
      if (cardIndex === -1) break;
      
      const card = player.hand[cardIndex];
      const def = getCardDef(card.cardId);

      if (nextState.phase === 'ACTION') {
        if (!def.types.includes('ACTION')) break; // Can only play actions
        if (player.actions <= 0) break;
        
        player.actions--;
        player.hand.splice(cardIndex, 1);
        player.playArea.push(card);
        nextState.logs.push(`${player.name} plays [${def.name}].`);
        
        if (def.onPlay) {
          const generatedActions = def.onPlay(nextState, action.playerId);
          nextState.pendingActions.unshift(...generatedActions);
        }
      } else if (nextState.phase === 'BUY') {
        if (!def.types.includes('TREASURE')) break; // Can only play treasures now
        player.hand.splice(cardIndex, 1);
        player.playArea.push(card);
        if (def.onPlay) {
          const generatedActions = def.onPlay(nextState, action.playerId);
          nextState.pendingActions.unshift(...generatedActions);
        }
      }
      break;
    }
    case 'BUY_CARD': {
      const player = nextState.players[action.playerId];
      if (nextState.phase !== 'BUY' || nextState.playerOrder[nextState.currentPlayerIndex] !== action.playerId) break;
      if (player.buys <= 0) break;
      if (nextState.supply[action.cardId] <= 0) break;
      
      const def = getCardDef(action.cardId);
      if (player.coins < def.cost) break;
      
      player.buys--;
      player.coins -= def.cost;
      nextState.supply[action.cardId]--;
      
      const newCard: CardInstance = { id: generateInstanceId(action.cardId), cardId: action.cardId };
      player.discard.push(newCard);
      nextState.logs.push(`${player.name} buys [${def.name}].`);
      break;
    }
    case 'END_PHASE': {
      if (nextState.playerOrder[nextState.currentPlayerIndex] !== action.playerId) break;
      
      if (nextState.phase === 'ACTION') {
        nextState.phase = 'BUY';
        autoPlayTreasures(nextState, action.playerId);
      } else if (nextState.phase === 'BUY') {
        // CLEANUP
        const player = nextState.players[action.playerId];
        player.discard.push(...player.playArea, ...player.hand);
        player.playArea = [];
        player.hand = [];
        player.coins = 0;
        player.actions = 0;
        player.buys = 0;
        
        nextState.pendingActions.push({ type: 'DRAW_CARDS', playerId: action.playerId, amount: 5 });
        
        // Next Turn
        nextState.currentPlayerIndex = (nextState.currentPlayerIndex + 1) % nextState.playerOrder.length;
        const nextPlayer = nextState.players[nextState.playerOrder[nextState.currentPlayerIndex]];
        nextState.phase = 'ACTION';
      const firstPlayerId = nextState.playerOrder[0];
        nextPlayer.actions = 1;
        nextPlayer.buys = 1;
        nextState.logs.push(`-- ${nextPlayer.name}'s turn starts --`);
      }
      break;
    }
    case 'RESOLVE_INPUT': {
      // Check if we are waiting for input
      if (nextState.pendingActions.length > 0 && nextState.pendingActions[0].type === 'REQUEST_INPUT') {
        const req = nextState.pendingActions[0];
        if (req.playerId !== action.playerId) break;
        
        // Handle specific inputs
        if (req.inputType === 'DISCARD_FOR_CELLAR') {
          const discardedIds: string[] = action.payload.discardedIds || [];
          const player = nextState.players[action.playerId];
          
          let validDiscards = 0;
          for (const id of discardedIds) {
            const idx = player.hand.findIndex(c => c.id === id);
            if (idx !== -1) {
              const card = player.hand.splice(idx, 1)[0];
              player.discard.push(card);
              validDiscards++;
            }
          }
          nextState.logs.push(`${player.name} discards ${validDiscards} cards to Cellar.`);
          
          // Pop the REQUEST_INPUT
          nextState.pendingActions.shift();
          
          // Push DRAW_CARDS
          if (validDiscards > 0) {
            nextState.pendingActions.unshift({ type: 'DRAW_CARDS', playerId: action.playerId, amount: validDiscards });
          }
        }
      }
      break;
    }
  }


  processPendingActions(nextState);

  // Auto-skip ACTION phase if no valid actions
  if (nextState.status === 'Playing' && nextState.phase === 'ACTION' && nextState.pendingActions.length === 0) {
    const p = nextState.players[nextState.playerOrder[nextState.currentPlayerIndex]];
    const hasActions = p.hand.some(c => getCardDef(c.cardId).types.includes('ACTION'));
    if (p.actions <= 0 || !hasActions) {
      nextState.phase = 'BUY';
      autoPlayTreasures(nextState, nextState.playerOrder[nextState.currentPlayerIndex]);
    }
  }

  // Auto-end BUY phase if 0 buys
  if (nextState.status === 'Playing' && nextState.phase === 'BUY' && nextState.pendingActions.length === 0) {
    const p = nextState.players[nextState.playerOrder[nextState.currentPlayerIndex]];
    if (p.buys <= 0) {
        nextState.actionQueue = nextState.actionQueue || [];
        nextState.actionQueue.unshift({ delayMs: 0, action: { type: 'END_PHASE', playerId: p.id } });
    }
  }

  nextState = checkBotTurn(nextState);

  recalculateVP(nextState);
  return nextState;

}
