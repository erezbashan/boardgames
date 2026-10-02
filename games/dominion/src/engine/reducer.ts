import { baseReducer } from '@erez/boardgame-core';
import { getBotAction } from '../bot/registry';
import { DominionState, PendingAction, CardInstance, Phase, PlayerState, ALL_KINGDOM_CARDS } from './types';
import { PlayerAction } from './actions';

import { getCardDef } from './cards';

function recalculateVP(state: DominionState) {
  Object.values(state.players).forEach((p: any) => {
    let vp = 0;
    const allCards = [...p.deck, ...p.discard, ...p.hand, ...p.playArea];
    const totalCards = allCards.length;
    allCards.forEach(c => {
      if (c.cardId === 'estate') vp += 1;
      if (c.cardId === 'duchy') vp += 3;
      if (c.cardId === 'province') vp += 6;
      if (c.cardId === 'curse') vp -= 1;
      if (c.cardId === 'gardens') vp += Math.floor(totalCards / 10);
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
        if (pending.amount > 0) {
          state.actionQueue = state.actionQueue || [];
          state.actionQueue.unshift({ delayMs: 250, action: { type: 'DRAW_CARDS_ASYNC', playerId: pending.playerId, amount: pending.amount } });
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
        player.turnBuyingPower = Math.max(player.turnBuyingPower || 0, player.coins);
        break;
      case 'SHUFFLE_DISCARD':
        player.deck = shuffle([...player.deck, ...player.discard]);
        player.discard = [];
        break;
      case 'LOG':
        state.logs.push((pending as any).message);
        break;
      case 'FORCE_GAIN_CARD': {
        const { cardId, destination } = pending as any;
        if (state.supply[cardId] > 0) {
          state.supply[cardId]--;
          const inst = { id: generateInstanceId(cardId), cardId };
          if (destination === 'hand') player.hand.push(inst);
          else if (destination === 'deck') player.deck.push(inst);
          else player.discard.push(inst);
          state.logs.push(`${player.name} gains [${getCardDef(cardId).name}].`);
        }
        break;
      }
      case 'REVEAL_CARD': {
        const { instanceId, message } = pending as any;
        const card = player.hand.find(c => c.id === instanceId);
        if (card) {
          card._revealed = true;
        }
        if (message) {
          state.logs.push(message);
        }
        break;
      }
      case 'REVEAL_HAND': {
        if (player.hand.length === 0) {
          state.logs.push(`${player.name} reveals an empty hand.`);
        } else {
          const names = player.hand.map(c => `[${getCardDef(c.cardId).name}]`).join(', ');
          state.logs.push(`${player.name} reveals their hand: ${names}`);
          // Pulse all cards to show they were revealed
          player.hand.forEach(c => c._revealed = true);
        }
        break;
      }
      case 'MILITIA_ATTACK': {
        const { playerId: targetId } = pending as any;
        const p = state.players[targetId];
        if (p.hand.length > 3) {
           const hasMoat = p.hand.some(c => c.cardId === 'moat');
           if (hasMoat) {
             const moat = p.hand.find(c => c.cardId === 'moat');
             state.logs.push(`🛡️ [Moat] ${p.name} reveals a Moat and is unaffected by the attack.`);
             if (moat) moat._revealed = true;
           } else {
             state.pendingActions.unshift({
               type: 'REQUEST_INPUT',
               playerId: targetId,
               inputType: 'DISCARD_FOR_MILITIA',
               payload: { amount: p.hand.length - 3 }
             });
           }
        }
        break;
      }
      case 'WITCH_ATTACK': {
        const { playerId: targetId } = pending as any;
        const p = state.players[targetId];
        const hasMoat = p.hand.some(c => c.cardId === 'moat');
        if (hasMoat) {
           const moat = p.hand.find(c => c.cardId === 'moat');
           state.logs.push(`🛡️ [Moat] ${p.name} reveals a Moat and is unaffected by the attack.`);
           if (moat) moat._revealed = true;
        } else {
           state.pendingActions.unshift({ type: 'FORCE_GAIN_CARD', playerId: targetId, cardId: 'curse' });
        }
        break;
      }
      case 'BUREAUCRAT_ATTACK': {
        const { playerId: targetId } = pending as any;
        const p = state.players[targetId];
        const hasMoat = p.hand.some(c => c.cardId === 'moat');
        if (hasMoat) {
           const moat = p.hand.find(c => c.cardId === 'moat');
           state.logs.push(`🛡️ [Moat] ${p.name} reveals a Moat and is unaffected by the attack.`);
           if (moat) moat._revealed = true;
        } else {
           const vCards = p.hand.filter(c => getCardDef(c.cardId).types.includes('VICTORY'));
           const uniqueIds = new Set(vCards.map(c => c.cardId));
           if (vCards.length === 0) {
             state.pendingActions.unshift({ type: 'REVEAL_HAND', playerId: targetId });
           } else if (uniqueIds.size === 1) {
             const card = vCards[0];
             const idx = p.hand.findIndex(c => c.id === card.id);
             p.hand.splice(idx, 1);
             p.deck.push(card);
             state.logs.push(`${p.name} puts a Victory card on their deck.`);
           } else {
             state.pendingActions.unshift({ type: 'REQUEST_INPUT', playerId: targetId, inputType: 'HAND_TO_DECK', payload: { filterTypes: ['VICTORY'] } });
           }
        }
        break;
      }
      case 'BANDIT_ATTACK': {
        state.actionQueue = state.actionQueue || [];
        state.actionQueue.push({ delayMs: 100, action: { type: 'ENQUEUE_PENDING_ACTION', pendingAction: { type: 'BANDIT_REVEAL_NEXT', playerId: pending.playerId, cardsLeft: 2, revealedCards: [] } } });
        break;
      }
      case 'BANDIT_REVEAL_NEXT': {
        const { playerId, cardsLeft, revealedCards } = pending as any;
        const p = state.players[playerId];
        if (cardsLeft > 0) {
          if (p.deck.length === 0 && p.discard.length > 0) {
            p.deck = shuffle([...p.discard]);
            p.discard = [];
            state.logs.push(`${p.name} shuffles their discard pile.`);
          }
          const c = p.deck.pop();
          if (c) {
            revealedCards.push(c);
            p.transientDeckReveals = [c.cardId];
            p.discard.push(c);
            
            state.actionQueue = state.actionQueue || [];
            state.actionQueue.unshift(
                { delayMs: 1500, action: { type: 'CLEAR_DECK_REVEALS', playerId } },
                { delayMs: 100, action: { type: 'ENQUEUE_PENDING_ACTION', pendingAction: { type: 'BANDIT_REVEAL_NEXT', playerId, cardsLeft: cardsLeft - 1, revealedCards } } }
            );
          } else {
            state.actionQueue = state.actionQueue || [];
            state.actionQueue.unshift({ delayMs: 100, action: { type: 'ENQUEUE_PENDING_ACTION', pendingAction: { type: 'RESOLVE_BANDIT', playerId, revealedCards } } });
          }
        } else {
          state.actionQueue = state.actionQueue || [];
          state.actionQueue.unshift({ delayMs: 100, action: { type: 'ENQUEUE_PENDING_ACTION', pendingAction: { type: 'RESOLVE_BANDIT', playerId, revealedCards } } });
        }
        break;
      }
      case 'RESOLVE_BANDIT': {
        const { revealedCards } = pending as any;
        
        // Find treasures other than copper
        const trasheableTreasures = revealedCards.filter((c: any) => getCardDef(c.cardId).types.includes('TREASURE') && c.cardId !== 'copper');
        let toTrash: any = null;
        
        if (trasheableTreasures.length > 0) {
          trasheableTreasures.sort((a: any, b: any) => getCardDef(b.cardId).cost - getCardDef(a.cardId).cost);
          toTrash = trasheableTreasures[0];
          state.trash.push(toTrash);
          // Splice it out of discard since we put it there visually in REVEAL_NEXT
          const idx = player.discard.findIndex((c: any) => c.id === toTrash.id);
          if (idx !== -1) player.discard.splice(idx, 1);
        }
        
        for (const c of revealedCards) {
          if (toTrash && c.id === toTrash.id) {
             state.logs.push(`${player.name} reveals [${getCardDef(c.cardId).name}] from their deck and trashes it.`);
          } else {
             state.logs.push(`${player.name} reveals [${getCardDef(c.cardId).name}] from their deck and discards it.`);
          }
        }
        break;
      }
      case 'PLAY_MERCHANT': {
        player.merchantPlays = (player.merchantPlays || 0) + 1;
        break;
      }
      case 'CLEAR_MERCHANT': {
        player.merchantPlays = 0;
        break;
      }
      case 'VASSAL_EFFECT': {
        if (player.deck.length === 0 && player.discard.length > 0) {
          player.deck = shuffle([...player.discard]);
          player.discard = [];
          state.logs.push(`${player.name} shuffles their discard pile.`);
        }
        const card = player.deck.pop();
        if (card) {
          state.logs.push(`${player.name} reveals [${getCardDef(card.cardId).name}] from the top of their deck.`);
          state.actionQueue = state.actionQueue || [];
          
          state.actionQueue.push({ delayMs: 100, action: { type: 'SHOW_DECK_REVEALS', playerId: player.id, cardIds: [card.cardId] } });

          if (getCardDef(card.cardId).types.includes('ACTION')) {
            // Leave it revealed until the action resolves!
            if (player.isBot) {
               state.actionQueue.push({ delayMs: 100, action: { type: 'BOT_PLAY_VASSAL', playerId: player.id, instanceId: card.id } });
            } else {
               // Must add the card to a special holding area so RESOLVE_INPUT can find it?
               // Wait! I can just put it in discard right now and keep the visual overlay on the deck!
               // But user specifically said "wait... move to discard".
               player.discard.push(card);
               state.actionQueue.push({ delayMs: 100, action: { type: 'ENQUEUE_PENDING_ACTION', pendingAction: { type: 'REQUEST_INPUT', playerId: player.id, inputType: 'PLAY_VASSAL_ACTION', payload: { instanceId: card.id, cardId: card.cardId } } } });
            }
          } else {
             // Not an action card. Wait 1.5s, then discard.
             state.actionQueue.push({ delayMs: 1500, action: { type: 'CLEAR_DECK_REVEALS', playerId: player.id } });
             state.actionQueue.push({ delayMs: 100, action: { type: 'ENQUEUE_PENDING_ACTION', pendingAction: { type: 'DISCARD_REVEALED_VASSAL', playerId: player.id, card } } });
          }
        } else {
          state.logs.push(`${player.name} has no cards to reveal.`);
        }
        break;
      }
      case 'DISCARD_REVEALED_VASSAL': {
        const { playerId, card } = pending as any;
        const p = state.players[playerId];
        p.discard.push(card);
        state.logs.push(`${p.name} discards the revealed [${getCardDef(card.cardId).name}].`);
        break;
      }
      case 'LIBRARY_DRAW': {
        const { setAside } = pending as any;
        if (player.hand.length >= 7) {
          if (setAside && setAside.length > 0) {
            player.discard.push(...setAside);
            state.logs.push(`${player.name} discards ${setAside.length} set aside cards.`);
          }
        } else {
          state.actionQueue = state.actionQueue || [];
          state.actionQueue.unshift({ delayMs: 400, action: { type: 'ENQUEUE_PENDING_ACTION', pendingAction: { type: 'LIBRARY_DRAW_ONE', playerId: player.id, setAside } } });
        }
        break;
      }
      case 'LIBRARY_DRAW_ONE': {
        const { setAside } = pending as any;
        if (player.deck.length === 0 && player.discard.length > 0) {
          player.deck = shuffle([...player.discard]);
          player.discard = [];
          state.logs.push(`${player.name} shuffles their discard pile.`);
        }
        const card = player.deck.pop();
        if (!card) {
          if (setAside && setAside.length > 0) {
            player.discard.push(...setAside);
            state.logs.push(`${player.name} discards ${setAside.length} set aside cards.`);
          }
        } else {
          const def = getCardDef(card.cardId);
          if (def.types.includes('ACTION')) {
            player.discard.push(card); // visually put on discard
            state.pendingActions.unshift({ type: 'REQUEST_INPUT', playerId: player.id, inputType: 'LIBRARY_KEEP', payload: { card, setAside } });
          } else {
            player.hand.push(card);
            state.pendingActions.unshift({ type: 'LIBRARY_DRAW', playerId: player.id, setAside }); // loop
          }
        }
        break;
      }
      case 'SENTRY_EFFECT': {
        if (player.deck.length === 0 && player.discard.length > 0) {
          player.deck = shuffle([...player.discard]);
          player.discard = [];
          state.logs.push(`${player.name} shuffles their discard pile.`);
        }
        const cards = [];
        const c1 = player.deck.pop();
        if (c1) cards.push(c1);
        
        if (player.deck.length === 0 && player.discard.length > 0) {
          player.deck = shuffle([...player.discard]);
          player.discard = [];
          state.logs.push(`${player.name} shuffles their discard pile.`);
        }
        const c2 = player.deck.pop();
        if (c2) cards.push(c2);
        
        if (cards.length > 0) {
          state.pendingActions.unshift({ type: 'REQUEST_INPUT', playerId: player.id, inputType: 'SENTRY_CHOICE', payload: { cards } });
        }
        break;
      }
    }
  }
}

import { DominionAction } from './actions';

function checkBotTurn(state: DominionState): DominionState {
  if (state.status !== 'Playing') return state;
  if (state.actionQueue && state.actionQueue.length > 0) return state; // Engine is busy, wait!

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


export function dominionReducer
(state: DominionState, action: DominionAction): DominionState {
  // First run through the baseReducer to handle JOIN_GAME, START_GAME, etc.
  let nextState = baseReducer(state, action as any) as DominionState;
  
  // Now deep clone for our own mutations to be safe
  nextState = JSON.parse(JSON.stringify(nextState));

  switch (action.type) {
    case 'UPDATE_SETTINGS': {
      nextState.settings = action.payload;
      break;
    }

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
  
    case 'AUTO_PLAY_TREASURES': {
      if (nextState.status !== 'Playing') break;
      const player = nextState.players[action.playerId];
      if (!player) break;
      const treasures = player.hand.filter((c: any) => getCardDef(c.cardId).types.includes('TREASURE'));
      treasures.sort((a: any, b: any) => {
         const defA = getCardDef(a.cardId);
         const defB = getCardDef(b.cardId);
         if (defA.cost !== defB.cost) return defB.cost - defA.cost;
         return a.cardId.localeCompare(b.cardId);
      });
      if (treasures.length > 0) {
        const t = treasures[0]; // just one!
        player.hand = player.hand.filter((c: any) => c.id !== t.id);
        player.playArea.push(t);
        const def = getCardDef(t.cardId);
        if (def.onPlay) {
           nextState.pendingActions.unshift(...def.onPlay(nextState, action.playerId));
        }
        const lastLog = nextState.logs[nextState.logs.length - 1] || "";
        const match = lastLog.match(new RegExp(`^${player.name} plays (?:(\\d+) )?\\[${def.name}\\]\\.?$`));
        if (match) {
           const count = match[1] ? parseInt(match[1]) + 1 : 2;
           nextState.logs[nextState.logs.length - 1] = `${player.name} plays ${count} [${def.name}].`;
        } else {
           nextState.logs.push(`${player.name} plays [${def.name}].`);
        }
        if (treasures.length > 1) {
           nextState.actionQueue = nextState.actionQueue || [];
           nextState.actionQueue.push({ delayMs: 250, action: { type: 'AUTO_PLAY_TREASURES', playerId: action.playerId }});
        }
      }
      break;
    }

    case 'DRAW_CARDS_ASYNC': {
      if (nextState.status !== 'Playing') break;
      const player = nextState.players[action.playerId];
      if (!player) break;
      
      if (player.deck.length === 0) {
        if (player.discard.length === 0) {
           if (action.onComplete) {
              nextState.actionQueue = nextState.actionQueue || [];
              nextState.actionQueue.push({ delayMs: 250, action: action.onComplete });
           }
           break; 
        }
        player.deck = shuffle([...player.discard]);
        player.discard = [];
        nextState.logs.push(`${player.name} shuffles their discard pile`);
      }
      const card = player.deck.pop();
      if (card) {
        player.hand.push(card);
        const lastLog = nextState.logs[nextState.logs.length - 1] || "";
        const match = lastLog.match(new RegExp(`^${player.name} draws (?:a|(\\d+)) cards?$`));
        if (match) {
           const count = match[1] ? parseInt(match[1]) + 1 : 2;
           nextState.logs[nextState.logs.length - 1] = `${player.name} draws ${count} cards`;
        } else {
           nextState.logs.push(`${player.name} draws a card`);
        }
      }
      
      if (action.amount > 1) {
        nextState.actionQueue = nextState.actionQueue || [];
        nextState.actionQueue.unshift({ delayMs: 250, action: { type: 'DRAW_CARDS_ASYNC', playerId: action.playerId, amount: action.amount - 1, onComplete: action.onComplete } });
      } else if (action.onComplete) {
        nextState.actionQueue = nextState.actionQueue || [];
        nextState.actionQueue.unshift({ delayMs: 250, action: action.onComplete });
      }
      break;
    }
    case 'SHOW_KINGDOM_CARD': {
      nextState.revealedCard = (action as any).cardId;
      break;
    }
    case 'ADD_KINGDOM_CARD': {
      delete nextState.revealedCard;
      nextState.supply[(action as any).cardId] = (action as any).amount;
      nextState.logs.push(`Kingdom card selected: [${getCardDef((action as any).cardId).name}]`);
      break;
    }
    case 'SHOW_DECK_REVEALS': {
      const p = nextState.players[(action as any).playerId];
      if (p) p.transientDeckReveals = (action as any).cardIds;
      break;
    }
    case 'CLEAR_DECK_REVEALS': {
      const p = nextState.players[(action as any).playerId];
      if (p) delete p.transientDeckReveals;
      break;
    }
    case 'POPUP_CARD': {
      nextState.revealedCard = (action as any).cardId;
      break;
    }
    case 'CLEAR_POPUP': {
      delete nextState.revealedCard;
      break;
    }
    case 'CLEAR_REVEALED': {
      const p = nextState.players[(action as any).playerId];
      if (p) p.hand.forEach(c => c._revealed = false);
      break;
    }
    case 'ENQUEUE_PENDING_ACTION': {
      nextState.pendingActions.unshift((action as any).pendingAction);
      processPendingActions(nextState);
      break;
    }
    case 'BOT_PLAY_VASSAL': {
      const { playerId, instanceId } = action as any;
      const player = nextState.players[playerId];
      const idx = player.discard.findIndex(c => c.id === instanceId);
      if (idx >= 0) {
         const card = player.discard.splice(idx, 1)[0];
         const def = getCardDef(card.cardId);
         player.playArea.push(card);
         nextState.logs.push(`${player.name} plays [${def.name}] via Vassal.`);
         if (def.onPlay) {
           nextState.pendingActions.unshift(...def.onPlay(nextState, player.id));
         }
      }
      processPendingActions(nextState);
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
      const numPlayers = nextState.playerOrder.length;
      // Per Dominion rules: 2p=8 provinces/duchies/estates, 3-4p=12
      let baseVictoryCount = numPlayers <= 2 ? 8 : 12;
      if (nextState.settings?.gameLength === 'Fast') baseVictoryCount = Math.max(1, Math.floor(baseVictoryCount * 0.25));
      else if (nextState.settings?.gameLength === 'Short') baseVictoryCount = Math.max(1, Math.floor(baseVictoryCount * 0.5));
      else if (nextState.settings?.gameLength === 'Marathon') baseVictoryCount = Math.floor(baseVictoryCount * 1.5);
      
      // Per Dominion rules: 60 copper minus 7 per player (starters), min 0
      const copperCount = Math.max(0, 60 - 7 * numPlayers);
      
      // Build kingdom supply from settings (or defaults)
      const allowedPool = nextState.settings?.kingdomCards?.length
        ? nextState.settings.kingdomCards
        : ALL_KINGDOM_CARDS;
      // Pick 10 randomly
      const kingdomCards = shuffle([...allowedPool]).slice(0, 10);

      // Add base cards to supply immediately
      nextState.supply = {
        copper: copperCount, silver: 40, gold: 30,
        estate: baseVictoryCount, duchy: baseVictoryCount, province: baseVictoryCount,
      };

      // Only add curse if there is a card that interacts with it (Witch)
      if (kingdomCards.includes('witch')) {
        nextState.supply.curse = numPlayers <= 2 ? 10 : (numPlayers - 1) * 10;
      }
      
      nextState.history = [];
      
      Object.values(nextState.players).forEach(p => {
        p.deck = createInitialDeck();
        p.hand = [];
        p.discard = [];
        p.playArea = [];
      });
      nextState.currentPlayerIndex = 0;
      nextState.phase = 'CLEANUP'; // Block actions while starting hands draw
      const firstPlayerId = nextState.playerOrder[0];

      nextState.actionQueue = nextState.actionQueue || [];
      
      // We queue the kingdom card animations as a flat list
      for (let i = 0; i < kingdomCards.length; i++) {
         const cardId = kingdomCards[i];
         const def = getCardDef(cardId);
         const amount = def.types.includes('VICTORY') ? baseVictoryCount : 10;
         nextState.actionQueue.push({ delayMs: 300, action: { type: 'SHOW_KINGDOM_CARD', cardId } });
         nextState.actionQueue.push({ delayMs: 2400, action: { type: 'ADD_KINGDOM_CARD', cardId, amount } });
      }
      
      // Then players draw cards
      for (let i = 0; i < nextState.playerOrder.length; i++) {
         // Instead of one DRAW_CARDS_ASYNC for 5, we can push 5 individual DRAW_CARDS_ASYNC of amount 1
         // or we can change DRAW_CARDS_ASYNC to unshift so it doesn't need onComplete
         nextState.actionQueue.push({ delayMs: 250, action: { type: 'DRAW_CARDS_ASYNC', playerId: nextState.playerOrder[i], amount: 5 } });
      }

      nextState.actionQueue.push({ delayMs: 250, action: { type: 'START_TURN', playerId: firstPlayerId } });

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
                const lastLog = nextState.logs[nextState.logs.length - 1] || "";
        const match = lastLog.match(new RegExp(`^${player.name} plays (?:(\\d+) )?\\[${def.name}\\]\\.?$`));
        if (match) {
           const count = match[1] ? parseInt(match[1]) + 1 : 2;
           nextState.logs[nextState.logs.length - 1] = `${player.name} plays ${count} [${def.name}].`;
        } else {
           nextState.logs.push(`${player.name} plays [${def.name}].`);
        }
        
        if (def.onPlay) {
          const generatedActions = def.onPlay(nextState, action.playerId);
          nextState.pendingActions.unshift(...generatedActions);
        }
      } else if (nextState.phase === 'BUY') {
        if (!def.types.includes('TREASURE')) break; // Can only play treasures now
        player.hand.splice(cardIndex, 1);
        player.playArea.push(card);
        const lastLog = nextState.logs[nextState.logs.length - 1] || "";
        const match = lastLog.match(new RegExp(`^${player.name} plays (?:(\\d+) )?\\[${def.name}\\]\\.?$`));
        if (match) {
           const count = match[1] ? parseInt(match[1]) + 1 : 2;
           nextState.logs[nextState.logs.length - 1] = `${player.name} plays ${count} [${def.name}].`;
        } else {
           nextState.logs.push(`${player.name} plays [${def.name}].`);
        }
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
        nextState.actionQueue = nextState.actionQueue || [];
        nextState.actionQueue.push({ delayMs: 500, action: { type: 'AUTO_PLAY_TREASURES', playerId: action.playerId } });
      } else if (nextState.phase === 'BUY') {
        nextState.phase = 'CLEANUP';
        const player = nextState.players[action.playerId];
        nextState.logs.push(`-- ${player.name}'s turn ends --`);
        nextState.actionQueue = nextState.actionQueue || [];
        nextState.actionQueue.push({ delayMs: 500, action: { type: 'CLEANUP_PHASE', playerId: action.playerId } });
      }
      break;
    }
    case 'CLEANUP_PHASE': {
      const player = nextState.players[action.playerId];
      const validPlayArea = player.playArea.filter(c => !(c as any)._throned);
      // Clear any transient revealed flags
      player.hand.forEach(c => delete c._revealed);
      validPlayArea.forEach(c => delete c._revealed);
      
      player.discard.push(...validPlayArea, ...player.hand);
      player.playArea = [];
      player.hand = [];
      player.coins = 0;
      player.actions = 0;
      player.buys = 0;
      player.merchantPlays = 0;
      
      nextState.recentBuyingPowers = nextState.recentBuyingPowers || [];
      nextState.recentBuyingPowers.push(player.turnBuyingPower || 0);

      const nextPlayerIndex = (nextState.playerOrder.indexOf(action.playerId) + 1) % nextState.playerOrder.length;
      const nextPlayerId = nextState.playerOrder[nextPlayerIndex];

      nextState.actionQueue = nextState.actionQueue || [];
      nextState.actionQueue.push({ delayMs: 250, action: { 
         type: 'DRAW_CARDS_ASYNC', 
         playerId: action.playerId, 
         amount: 5,
         onComplete: { type: 'START_TURN', playerId: nextPlayerId }
      }});
      break;
    }
    case 'START_TURN': {
      nextState.currentPlayerIndex = nextState.playerOrder.indexOf(action.playerId);
      const nextPlayer = nextState.players[action.playerId];
      nextState.phase = 'ACTION';
      nextPlayer.actions = 1;
      nextPlayer.buys = 1;
      nextPlayer.turnBuyingPower = 0;
      nextPlayer.hand.forEach(c => c._revealed = false);
      nextState.logs.push(`-- ${nextPlayer.name}'s turn starts --`);
      
      // Push VP snapshot for stats graph (once per player turn)
      nextState.history = nextState.history || [];
      const turnNum = nextState.history.length + 1;
      const vpSnapshot: Record<string, number> = {};
      const deckSizeSnapshot: Record<string, number> = {};
      nextState.playerOrder.forEach(pid => {
        const p = nextState.players[pid];
        vpSnapshot[pid] = p.victoryPoints;
        const allCards = [...p.deck, ...p.hand, ...p.playArea, ...p.discard];
        deckSizeSnapshot[pid] = allCards.length;
      });
      nextState.history.push({ turnNum, vps: vpSnapshot, deckSizes: deckSizeSnapshot });
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

        if (req.inputType === 'TRASH_FOR_CHAPEL') {
          const trashedIds: string[] = action.payload.trashedIds || [];
          const player = nextState.players[action.playerId];
          
          let trashedCardNames: string[] = [];
          for (const id of trashedIds.slice(0, 4)) {
            const idx = player.hand.findIndex(c => c.id === id);
            if (idx !== -1) {
              const card = player.hand.splice(idx, 1)[0];
              nextState.trash = nextState.trash || [];
              nextState.trash.push(card);
              trashedCardNames.push(`[${getCardDef(card.cardId).name}]`);
            }
          }
          if (trashedCardNames.length > 0) {
            nextState.logs.push(`${player.name} trashes ${trashedCardNames.join(', ')} with Chapel.`);
          }
          
          // Pop the REQUEST_INPUT
          nextState.pendingActions.shift();
        }

        if (req.inputType === 'PLAY_FOR_THRONE_ROOM') {
          const instanceId: string = action.payload.instanceId;
          const player = nextState.players[action.playerId];
          
          if (!instanceId) {
             nextState.pendingActions.shift();
          } else {
             const idx = player.hand.findIndex(c => c.id === instanceId);
             if (idx !== -1) {
                const card = player.hand.splice(idx, 1)[0];
                const def = getCardDef(card.cardId);
                if (def.types.includes('ACTION')) {
                   player.playArea.push(card);
                   nextState.logs.push(`${player.name} plays [${def.name}] via Throne Room.`);
                   
                   const clonedCard = { ...card, id: card.id + '_throne', _throned: true } as any;
                   player.playArea.push(clonedCard);
                   
                   nextState.pendingActions.shift();

                   if (def.onPlay) {
                      const actions2 = def.onPlay(nextState, action.playerId);
                      const actions1 = def.onPlay(nextState, action.playerId);
                      
                      // Queue them: actions1 first, then a special log, then actions2
                      nextState.pendingActions.unshift(
                         ...actions1,
                         { type: 'LOG', playerId: action.playerId, message: `${player.name} plays [${def.name}] again.` } as any,
                         ...actions2
                      );
                   }
                } else {
                   nextState.pendingActions.shift();
                }
             } else {
                nextState.pendingActions.shift();
             }
          }
        }

        if (req.inputType === 'GAIN_CARD') {
          const cardId: string = action.payload.cardId;
          const player = nextState.players[action.playerId];
          
          if (cardId && nextState.supply[cardId] > 0) {
            const def = getCardDef(cardId);
            const maxCost = req.payload?.maxCost || 99;
            if (def.cost <= maxCost) {
              nextState.supply[cardId]--;
              const inst = { id: generateInstanceId(cardId), cardId };
              if (req.payload?.destination === 'hand') player.hand.push(inst);
              else if (req.payload?.destination === 'deck') player.deck.push(inst);
              else player.discard.push(inst);
              nextState.logs.push(`${player.name} gains [${def.name}].`);
            }
          }
          nextState.pendingActions.shift();
        }

        if (req.inputType === 'TRASH_COPPER_FOR_MONEYLENDER') {
          const trashedIds: string[] = action.payload.trashedIds || [];
          const player = nextState.players[action.playerId];
          if (trashedIds.length === 1) {
            const cardIndex = player.hand.findIndex(c => c.id === trashedIds[0] && c.cardId === 'copper');
            if (cardIndex >= 0) {
              const card = player.hand[cardIndex];
              player.hand.splice(cardIndex, 1);
              nextState.trash.push(card);
              player.coins += 3;
              nextState.logs.push(`${player.name} trashes a Copper for +3 Coins.`);
            }
          }
          nextState.pendingActions.shift();
        }

        if (req.inputType === 'HAND_TO_DECK') {
          const instanceId: string = action.payload.instanceId || action.payload.cardId;
          const player = nextState.players[action.playerId];
          if (instanceId) {
            const idx = player.hand.findIndex(c => c.id === instanceId);
            if (idx >= 0) {
              const card = player.hand.splice(idx, 1)[0];
              player.deck.push(card);
              nextState.logs.push(`${player.name} puts a card from hand onto their deck.`);
            }
          }
          nextState.pendingActions.shift();
        }

        if (req.inputType === 'DISCARD_TO_DECK') {
          const instanceId: string = action.payload.instanceId || action.payload.cardId;
          const player = nextState.players[action.playerId];
          if (instanceId) {
            const idx = player.discard.findIndex(c => c.id === instanceId);
            if (idx >= 0) {
              const card = player.discard.splice(idx, 1)[0];
              player.deck.push(card);
              nextState.logs.push(`${player.name} puts a card from their discard pile onto their deck.`);
            }
          }
          nextState.pendingActions.shift();
        }

        if (req.inputType === 'PLAY_VASSAL_ACTION') {
          const playCard: boolean = action.payload.playCard;
          const instanceId: string = req.payload.instanceId;
          const player = nextState.players[action.playerId];
          nextState.pendingActions.shift();
          delete player.transientDeckReveals;

          if (playCard) {
            const idx = player.discard.findIndex(c => c.id === instanceId);
            if (idx >= 0) {
               const card = player.discard.splice(idx, 1)[0];
               const def = getCardDef(card.cardId);
               player.playArea.push(card);
               nextState.logs.push(`${player.name} plays [${def.name}] from Vassal.`);
               if (def.onPlay) {
                 const newPending = def.onPlay(nextState, player.id);
                 if (newPending && newPending.length > 0) {
                   nextState.pendingActions.unshift(...newPending);
                 }
               }
            }
          }
        }
        
        if (req.inputType === 'LIBRARY_KEEP') {
          const keep: boolean = action.payload.keep;
          const card = req.payload.card;
          const setAside = req.payload.setAside;
          const player = nextState.players[action.playerId];
          nextState.pendingActions.shift();
          
          const idx = player.discard.findIndex((c: any) => c.id === card.id);
          if (idx !== -1) {
            player.discard.splice(idx, 1);
          }
          
          if (keep) {
            player.hand.push(card);
          } else {
            setAside.push(card);
          }
          nextState.pendingActions.unshift({ type: 'LIBRARY_DRAW', playerId: player.id, setAside });
        }
        
        if (req.inputType === 'SENTRY_CHOICE') {
          const { trashIds = [], discardIds = [], deckIds = [] } = action.payload;
          const cards = req.payload.cards;
          const player = nextState.players[action.playerId];
          nextState.pendingActions.shift();
          
          const trashCards = cards.filter((c: any) => trashIds.includes(c.id));
          const discardCards = cards.filter((c: any) => discardIds.includes(c.id));
          
          if (trashCards.length > 0) {
            nextState.trash.push(...trashCards);
            nextState.logs.push(`${player.name} trashes ${trashCards.map((c: any) => `[${getCardDef(c.cardId).name}]`).join(' and ')}.`);
          }
          if (discardCards.length > 0) {
            player.discard.push(...discardCards);
            nextState.logs.push(`${player.name} discards ${discardCards.length} card(s).`);
          }
          
          for (let i = deckIds.length - 1; i >= 0; i--) {
            const id = deckIds[i];
            const c = cards.find((c: any) => c.id === id);
            if (c) player.deck.push(c);
          }
        }
        if (req.inputType === 'DISCARD_FOR_POACHER' || req.inputType === 'DISCARD_FOR_MILITIA') {
          const discardedIds: string[] = action.payload.discardedIds || [];
          const player = nextState.players[action.playerId];
          const toDiscard = Math.min(discardedIds.length, req.payload?.amount || 0);
          
          const discardedNames: string[] = [];
          for (let i = 0; i < toDiscard; i++) {
             const idx = player.hand.findIndex(c => c.id === discardedIds[i]);
             if (idx >= 0) {
               discardedNames.push(getCardDef(player.hand[idx].cardId).name);
               player.discard.push(player.hand[idx]);
               player.hand.splice(idx, 1);
             }
          }
          const cardName = req.inputType === 'DISCARD_FOR_POACHER' ? 'Poacher' : 'Militia';
          
          if (discardedNames.length > 0) {
            const counts = discardedNames.reduce((acc, name) => {
              acc[name] = (acc[name] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            const discardString = Object.entries(counts).map(([name, count]) => `${count} [${name}]`).join(', ');
            nextState.logs.push(`${player.name} discards ${discardString} for [${cardName}].`);
          } else {
            nextState.logs.push(`${player.name} discards nothing for [${cardName}].`);
          }
          nextState.pendingActions.shift();
        }

        if (req.inputType === 'TRASH_FOR_REMODEL') {
          const trashedIds: string[] = action.payload.trashedIds || [];
          const player = nextState.players[action.playerId];
          nextState.pendingActions.shift();
          
          if (trashedIds.length === 1) {
            const idx = player.hand.findIndex(c => c.id === trashedIds[0]);
            if (idx >= 0) {
              const card = player.hand[idx];
              player.hand.splice(idx, 1);
              nextState.trash.push(card);
              const maxCost = getCardDef(card.cardId).cost + 2;
              nextState.logs.push(`${player.name} trashes [${getCardDef(card.cardId).name}].`);
              nextState.pendingActions.unshift({ type: 'REQUEST_INPUT', playerId: action.playerId, inputType: 'GAIN_CARD', payload: { maxCost } });
            }
          }
        }

        if (req.inputType === 'TRASH_FOR_MINE') {
          const trashedIds: string[] = action.payload.trashedIds || [];
          const player = nextState.players[action.playerId];
          nextState.pendingActions.shift();
          
          if (trashedIds.length === 1) {
            const idx = player.hand.findIndex(c => c.id === trashedIds[0] && getCardDef(c.cardId).types.includes('TREASURE'));
            if (idx >= 0) {
              const card = player.hand[idx];
              player.hand.splice(idx, 1);
              nextState.trash.push(card);
              const maxCost = getCardDef(card.cardId).cost + 3;
              nextState.logs.push(`${player.name} trashes [${getCardDef(card.cardId).name}].`);
              nextState.pendingActions.unshift({ type: 'REQUEST_INPUT', playerId: action.playerId, inputType: 'GAIN_CARD', payload: { maxCost, destination: 'hand', treasureOnly: true } });
            }
          }
        }
      }
      break;
    }
  }


  processPendingActions(nextState);

  // Auto-skip ACTION phase if no valid actions
  if (nextState.status === 'Playing' && (!nextState.actionQueue || nextState.actionQueue.length === 0) && nextState.phase === 'ACTION' && nextState.pendingActions.length === 0) {
    const p = nextState.players[nextState.playerOrder[nextState.currentPlayerIndex]];
    const hasActions = p.hand.some(c => getCardDef(c.cardId).types.includes('ACTION'));
    if (p.actions <= 0 || !hasActions) {
      nextState.phase = 'BUY';
      nextState.actionQueue = nextState.actionQueue || [];
      nextState.actionQueue.push({ delayMs: 1000, action: { type: 'AUTO_PLAY_TREASURES', playerId: p.id } });
    }
  }

  // Auto-end BUY phase if 0 buys
  if (nextState.status === 'Playing' && (!nextState.actionQueue || nextState.actionQueue.length === 0) && nextState.phase === 'BUY' && nextState.pendingActions.length === 0) {
    const p = nextState.players[nextState.playerOrder[nextState.currentPlayerIndex]];
    if (p.buys <= 0) {
        nextState.actionQueue = nextState.actionQueue || [];
        nextState.actionQueue.unshift({ delayMs: 0, action: { type: 'END_PHASE', playerId: p.id } });
    }
  }

  nextState = checkBotTurn(nextState);

  recalculateVP(nextState);

  // End Game Detection
  if (nextState.status === 'Playing') {
    const emptyPiles = Object.values(nextState.supply).filter(count => count === 0).length;
    if (nextState.supply['province'] === 0 || emptyPiles >= 3) {
      nextState.status = 'Finished';
      if (nextState.supply['province'] === 0) {
        nextState.logs.push(`-- Game Over! (Province pile is empty) --`);
      } else {
        nextState.logs.push(`-- Game Over! (3 or more supply piles are empty) --`);
      }
      
      let bestVP = -Infinity;
      let winners: string[] = [];

      nextState.playerOrder.forEach((pid, index) => {
        const vp = nextState.players[pid].victoryPoints;
        // Relative turns taken: players after the current player took one fewer turn
        const turnsTaken = index <= nextState.currentPlayerIndex ? 1 : 0; 
        
        if (vp > bestVP) {
           bestVP = vp;
           winners = [pid];
        } else if (vp === bestVP) {
           const currentWinnerIndex = nextState.playerOrder.indexOf(winners[0]);
           const currentWinnerTurns = currentWinnerIndex <= nextState.currentPlayerIndex ? 1 : 0;
           
           if (turnsTaken < currentWinnerTurns) {
              winners = [pid]; // Tie-breaker: fewer turns taken wins
              nextState.logs.push(`Tie-breaker: ${nextState.players[pid].name} wins the tie with fewer turns taken.`);
           } else if (turnsTaken === currentWinnerTurns) {
              winners.push(pid); // True tie
           }
        }
      });
      
      nextState.winnerId = winners[0];
      if (winners.length > 1) {
         nextState.logs.push(`🏆 It's a tie between ${winners.map(id => nextState.players[id].name).join(' and ')} with ${bestVP} VP!`);
      } else {
         nextState.logs.push(`🏆 ${nextState.players[winners[0]].name} wins with ${bestVP} VP!`);
      }
    }
  }

  return nextState;

}
