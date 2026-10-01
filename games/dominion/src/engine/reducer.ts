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
          state.actionQueue.push({ delayMs: 250, action: { type: 'DRAW_CARDS_ASYNC', playerId: pending.playerId, amount: pending.amount } });
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
      case 'BANDIT_ATTACK': {
        // Opponent reveals top 2 cards of deck (shuffling if needed), trashes highest cost treasure (non-copper), discards rest.
        let revealedCards = [];
        for (let i = 0; i < 2; i++) {
          if (player.deck.length === 0 && player.discard.length > 0) {
            player.deck = shuffle([...player.discard]);
            player.discard = [];
            state.logs.push(`${player.name} shuffles their discard pile.`);
          }
          const c = player.deck.pop();
          if (c) revealedCards.push(c);
        }
        
        if (revealedCards.length > 0) {
          state.logs.push(`${player.name} reveals ${revealedCards.map(c => `[${getCardDef(c.cardId).name}]`).join(' and ')}.`);
          
          // Find treasures other than copper
          const trasheableTreasures = revealedCards.filter(c => getCardDef(c.cardId).types.includes('TREASURE') && c.cardId !== 'copper');
          
          if (trasheableTreasures.length > 0) {
            trasheableTreasures.sort((a, b) => getCardDef(b.cardId).cost - getCardDef(a.cardId).cost);
            const toTrash = trasheableTreasures[0];
            state.trash.push(toTrash);
            state.logs.push(`${player.name} trashes [${getCardDef(toTrash.cardId).name}].`);
            
            // Discard the rest
            revealedCards.forEach(c => {
              if (c.id !== toTrash.id) player.discard.push(c);
            });
          } else {
            // Discard all
            player.discard.push(...revealedCards);
            state.logs.push(`${player.name} discards them.`);
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
          player.discard.push(card);
          state.logs.push(`${player.name} discards [${getCardDef(card.cardId).name}].`);
          if (getCardDef(card.cardId).types.includes('ACTION')) {
            if (player.isBot) {
               // Bot always plays it
               const def = getCardDef(card.cardId);
               player.playArea.push(player.discard.pop()!);
               state.logs.push(`${player.name} plays [${def.name}] via Vassal.`);
               if (def.onPlay) {
                 state.pendingActions.unshift(...def.onPlay(state, player.id));
               }
            } else {
               // Request user input
               state.pendingActions.unshift({ type: 'REQUEST_INPUT', playerId: player.id, inputType: 'PLAY_VASSAL_ACTION', payload: { instanceId: card.id, cardId: card.cardId } });
            }
          }
        } else {
          state.logs.push(`${player.name} has no cards to discard.`);
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
        if (def.name === 'Copper') player.coins += 1;
        if (def.name === 'Silver') player.coins += 2;
        if (def.name === 'Gold') player.coins += 3;
        
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
        nextState.actionQueue.push({ delayMs: 250, action: { type: 'DRAW_CARDS_ASYNC', playerId: action.playerId, amount: action.amount - 1, onComplete: action.onComplete } });
      } else if (action.onComplete) {
        nextState.actionQueue = nextState.actionQueue || [];
        nextState.actionQueue.push({ delayMs: 250, action: action.onComplete });
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
      const numPlayers = nextState.playerOrder.length;
      // Per Dominion rules: 2p=8 provinces/duchies/estates, 3-4p=12
      const baseVictoryCount = nextState.settings?.victoryCardsOverride || (numPlayers <= 2 ? 8 : 12);
      
      // Per Dominion rules: 60 copper minus 7 per player (starters), min 0
      const copperCount = Math.max(0, 60 - 7 * numPlayers);
      // Build kingdom supply from settings (or defaults)
      const kingdomCards = nextState.settings?.kingdomCards?.length
        ? nextState.settings.kingdomCards
        : ALL_KINGDOM_CARDS.slice(0, 10);

      const kingdomSupply: Record<string, number> = {};
      kingdomCards.forEach(id => {
         const def = getCardDef(id);
         kingdomSupply[id] = def.types.includes('VICTORY') ? baseVictoryCount : 10;
      });

      nextState.supply = {
        copper: copperCount, silver: 40, gold: 30,
        estate: baseVictoryCount, duchy: baseVictoryCount, province: baseVictoryCount,
        ...kingdomSupply
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

      let chain: PlayerAction = { type: 'START_TURN', playerId: firstPlayerId };
      for (let i = nextState.playerOrder.length - 1; i >= 0; i--) {
         chain = { type: 'DRAW_CARDS_ASYNC', playerId: nextState.playerOrder[i], amount: 5, onComplete: chain };
      }
      nextState.actionQueue = nextState.actionQueue || [];
      nextState.actionQueue.push({ delayMs: 250, action: chain });

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
          
          let validTrashes = 0;
          for (const id of trashedIds.slice(0, 4)) {
            const idx = player.hand.findIndex(c => c.id === id);
            if (idx !== -1) {
              const card = player.hand.splice(idx, 1)[0];
              nextState.trash = nextState.trash || [];
              nextState.trash.push(card);
              validTrashes++;
            }
          }
          if (validTrashes > 0) {
            nextState.logs.push(`${player.name} trashes ${validTrashes} card${validTrashes > 1 ? 's' : ''} with Chapel.`);
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
          const cardId: string = action.payload.cardId;
          const player = nextState.players[action.playerId];
          if (cardId) {
            const idx = player.hand.findIndex(c => c.id === cardId);
            if (idx >= 0) {
              const card = player.hand.splice(idx, 1)[0];
              player.deck.push(card);
              nextState.logs.push(`${player.name} puts a card from hand onto their deck.`);
            }
          }
          nextState.pendingActions.shift();
        }

        if (req.inputType === 'DISCARD_TO_DECK') {
          const cardId: string = action.payload.cardId;
          const player = nextState.players[action.playerId];
          if (cardId) {
            const idx = player.discard.findIndex(c => c.id === cardId);
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

          if (playCard) {
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
      nextState.logs.push(`-- Game Over! --`);
      // Find winner: most VP; tie-break by fewest turns taken (more remaining turns = fewer taken)
      let bestVP = -Infinity;
      let winnerId: string | null = null;
      nextState.playerOrder.forEach(pid => {
        const vp = nextState.players[pid].victoryPoints;
        if (vp > bestVP) { bestVP = vp; winnerId = pid; }
      });
      nextState.winnerId = winnerId;
    }
  }

  return nextState;

}
