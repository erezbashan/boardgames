
import { baseInitialState, baseReducer } from '@erez/boardgame-core';
import { SplendorGameState, SplendorAction, SplendorPlayer, SplendorStats, GemInventory, BaseGemTypes, Card, Noble, GemType } from './types';
import { ALL_CARDS, ALL_NOBLES } from './data';
import { getBotAction } from './bots/registry';

export const emptyGems = (): GemInventory => ({ diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0, gold: 0 });
export const emptyStats = (): SplendorStats => ({ tokensCollected: 0, cardsReserved: 0, cardsPurchased: 0, noblesVisited: 0 });

export const initialSplendorState: SplendorGameState = {
  ...baseInitialState,
  players: {} as Record<string, SplendorPlayer>,
  bank: emptyGems(),
  decks: { tier1: [], tier2: [], tier3: [] },
  board: { tier1: [], tier2: [], tier3: [] },
  nobles: [],
  isFinalRound: false,
  turnState: 'take_tokens',
  pendingDiscardCount: 0,
  eligibleNoblesForCurrentPlayer: []
};

// Helper to shuffle an array
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Calculate total gems a player has
function getTotalGems(gems: GemInventory): number {
  return Object.values(gems).reduce((a, b) => a + b, 0);
}

// Calculate bonuses a player has
function getPlayerBonuses(player: SplendorPlayer): Record<string, number> {
  const bonuses: Record<string, number> = { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0 };
  for (const card of player.cards) {
    bonuses[card.bonus]++;
  }
  return bonuses;
}

// Check if player can afford a card and return the exact payment needed (including gold)
export function calculatePayment(player: SplendorPlayer, card: Card): GemInventory | null {
  const bonuses = getPlayerBonuses(player);
  let goldNeeded = 0;
  const payment = emptyGems();
  
  for (const gem of BaseGemTypes) {
    const cost = card.cost[gem] || 0;
    const discountedCost = Math.max(0, cost - bonuses[gem]);
    
    if (player.gems[gem] < discountedCost) {
      const deficit = discountedCost - player.gems[gem];
      goldNeeded += deficit;
      payment[gem] = player.gems[gem]; // Use all available
    } else {
      payment[gem] = discountedCost;
    }
  }
  
  if (player.gems.gold < goldNeeded) {
    return null; // Cannot afford
  }
  payment.gold = goldNeeded;
  return payment;
}


function scheduleBotIfNeeded(state: SplendorGameState): SplendorGameState {
  if (state.status !== 'Playing') return state;
  const currentPlayerId = state.playerOrder[state.currentPlayerIndex];
  const player = state.players[currentPlayerId];
  if (!player || !player.isBot) return state;

  if (state.actionQueue && state.actionQueue.some(a => (a.action as any).type === 'PLAY_BOT')) {
    return state;
  }
  return {
    ...state,
    actionQueue: [...(state.actionQueue || []), { delayMs: 3000, action: { type: 'PLAY_BOT' } as any }]
  };
}

function advanceTurnOrCheckNobles(state: SplendorGameState, playerId: string): SplendorGameState {
  const player = state.players[playerId];
  
  // 1. Check if over 10 gems
  const totalGems = getTotalGems(player.gems);
  if (totalGems > 10) {
    return {
      ...state,
      turnState: 'discard_tokens',
      pendingDiscardCount: totalGems - 10,
      logs: [...state.logs, `${player.name} must discard ${totalGems - 10} gems`]
    };
  }

  // 2. Check Nobles
  const bonuses = getPlayerBonuses(player);
  const eligibleNobles = state.nobles.filter(n => {
    for (const gem of BaseGemTypes) {
      if ((n.requirements[gem] || 0) > bonuses[gem]) return false;
    }
    return true;
  });

  if (eligibleNobles.length === 1) {
    // Automatically assign noble
    const noble = eligibleNobles[0];
    const newPlayer = {
      ...player,
      nobles: [...player.nobles, noble],
      score: player.score + noble.points,
      stats: {
        ...(player.stats || emptyStats()),
        noblesVisited: ((player.stats?.noblesVisited) || 0) + 1
      }
    };
    const newState = {
      ...state,
      players: { ...state.players, [playerId]: newPlayer },
      nobles: state.nobles.filter(n => n.id !== noble.id),
      logs: [...state.logs, `${player.name} was visited by a Noble!`]
    };
    return scheduleBotIfNeeded(finishTurn(newState, playerId));
  } else if (eligibleNobles.length > 1) {
    // Need to choose
    return {
      ...state,
      turnState: 'choose_noble',
      eligibleNoblesForCurrentPlayer: eligibleNobles
    };
  }

  return scheduleBotIfNeeded(finishTurn(state, playerId));
}

function finishTurn(state: SplendorGameState, playerId: string): SplendorGameState {
  const player = state.players[playerId];
  
  // Check win condition
  let isFinalRound = state.isFinalRound;
  if (player.score >= 15 && !isFinalRound) {
    isFinalRound = true;
    state.logs = [...state.logs, `${player.name} reached ${player.score} points! This is the final round.`];
  }

  
  if (!player.scoreHistory) player.scoreHistory = [];
  player.scoreHistory.push(player.score);
  const nextIndex = (state.currentPlayerIndex + 1) % state.playerOrder.length;

  
  if (isFinalRound && nextIndex === 0) {
    // Game over
    const winners = [...state.playerOrder].sort((a, b) => {
      if (state.players[b].score !== state.players[a].score) {
        return state.players[b].score - state.players[a].score;
      }
      return state.players[a].cards.length - state.players[b].cards.length; // tie breaker
    });
    
    return {
      ...state,
      status: 'Finished',
      winnerId: winners[0],
      isFinalRound: true,
      logs: [...state.logs, `Game Over! ${state.players[winners[0]].name} wins!`]
    };
  }

  return {
    ...state,
    currentPlayerIndex: nextIndex,
    turnState: 'take_tokens',
    isFinalRound,
    logs: [...state.logs, `--- ${state.players[state.playerOrder[nextIndex]].name}'s Turn ---`]
  };
}

// Replenish board
function replenishBoard(state: SplendorGameState): SplendorGameState {
  const newState = { ...state, board: { ...state.board }, decks: { ...state.decks } };
  for (const tier of ['tier1', 'tier2', 'tier3'] as const) {
    const row = [...newState.board[tier]];
    for (let i = 0; i < 4; i++) {
      if (!row[i] && newState.decks[tier].length > 0) {
        row[i] = newState.decks[tier].shift()!;
      }
    }
    newState.board[tier] = row;
  }
  return newState;
}

export function splendorReducer(state: SplendorGameState, action: SplendorAction): SplendorGameState {
  const nextState = baseReducer(state, action) as SplendorGameState;

  // Enhance players on JOIN_GAME
  if (action.type === 'JOIN_GAME') {
    const pid = action.payload.playerId;
    if (nextState.players[pid] && !nextState.players[pid].gems) {
      nextState.players[pid] = {
        ...nextState.players[pid],
        gems: emptyGems(),
        cards: [],
        reservedCards: [],
        nobles: [],
        score: 0,
        scoreHistory: [0],
        stats: emptyStats()
      };
    }
  }

  switch (action.type) {
    case 'START_GAME': {
      if (state.status !== 'Lobby') return state;
      
      const numPlayers = nextState.playerOrder.length;
      let tokensPerGem = 7;
      if (numPlayers === 2) tokensPerGem = 4;
      if (numPlayers === 3) tokensPerGem = 5;

      const bank = {
        diamond: tokensPerGem, sapphire: tokensPerGem, emerald: tokensPerGem,
        ruby: tokensPerGem, onyx: tokensPerGem, gold: 5
      };

      const shuffledTier1 = shuffle(ALL_CARDS.filter(c => c.tier === 1));
      const shuffledTier2 = shuffle(ALL_CARDS.filter(c => c.tier === 2));
      const shuffledTier3 = shuffle(ALL_CARDS.filter(c => c.tier === 3));

      const initializedPlayers = { ...nextState.players };
      for (const pid of nextState.playerOrder) {
        initializedPlayers[pid] = {
          ...initializedPlayers[pid],
          gems: emptyGems(),
          cards: [],
          reservedCards: [],
          nobles: [],
          score: 0,
          scoreHistory: [0],
          stats: emptyStats()
        };
      }

      let initializedState: SplendorGameState = {
        ...nextState,
        players: initializedPlayers,
        bank,
        decks: {
          tier1: shuffledTier1,
          tier2: shuffledTier2,
          tier3: shuffledTier3
        },
        board: {
          tier1: [null, null, null, null],
          tier2: [null, null, null, null],
          tier3: [null, null, null, null]
        },
        nobles: shuffle(ALL_NOBLES).slice(0, numPlayers + 1),
        isFinalRound: false
      };

      initializedState = replenishBoard(initializedState);
      initializedState.logs = [...initializedState.logs, "Game started!", `--- ${initializedState.players[initializedState.playerOrder[0]].name}\'s Turn ---`];
      return scheduleBotIfNeeded(initializedState);
    }

    case 'TAKE_GEMS': {
      if (state.status !== 'Playing' || state.turnState !== 'take_tokens') return state;
      
      const playerId = state.playerOrder[state.currentPlayerIndex];
      const player = state.players[playerId];
      const requested = action.payload.gems;
      
      let totalRequested = 0;
      let hasTwoOfSame = false;

      for (const gem of BaseGemTypes) {
        const amount = requested[gem] || 0;
        if (amount < 0 || amount > 2) return state; // Invalid
        if (amount > 0 && state.bank[gem] < amount) return state; // Not enough in bank
        if (amount === 2) {
          if (state.bank[gem] < 4) return state; // Must have >= 4 to take 2
          hasTwoOfSame = true;
        }
        totalRequested += amount;
      }
      
      if (requested.gold) return state; // Cannot take gold this way
      if (hasTwoOfSame && totalRequested !== 2) return state; // If taking 2 of one, can't take others
      if (!hasTwoOfSame && totalRequested > 3) return state; // Max 3 diff
      if (totalRequested === 0) return state; // Must take something

      const newBank = { ...state.bank };
      const newPlayerGems = { ...player.gems };

      for (const gem of BaseGemTypes) {
        const amount = requested[gem] || 0;
        newBank[gem] -= amount;
        newPlayerGems[gem] += amount;
      }

      const newState = {
        ...state,
        bank: newBank,
        players: {
          ...state.players,
          [playerId]: { 
            ...player, 
            gems: newPlayerGems,
            stats: {
              ...(player.stats || emptyStats()),
              tokensCollected: ((player.stats?.tokensCollected) || 0) + totalRequested
            }
          }
        },
        logs: [...state.logs, `${player.name} took ${Object.entries(requested).filter(([_, v]) => v > 0).flatMap(([k, v]) => Array(v).fill(`[${k}]`)).join(' ')}`]
      };

      return scheduleBotIfNeeded(advanceTurnOrCheckNobles(newState, playerId));
    }

    case 'DISCARD_GEMS': {
      if (state.status !== 'Playing' || state.turnState !== 'discard_tokens') return state;

      const playerId = state.playerOrder[state.currentPlayerIndex];
      const player = state.players[playerId];
      const discarded = action.payload.gems;

      let totalDiscarded = 0;
      const newPlayerGems = { ...player.gems };
      const newBank = { ...state.bank };

      for (const gem of Object.keys(player.gems) as GemType[]) {
        const amount = discarded[gem] || 0;
        if (amount < 0 || newPlayerGems[gem] < amount) return state; // Invalid
        newPlayerGems[gem] -= amount;
        newBank[gem] += amount;
        totalDiscarded += amount;
      }

      if (totalDiscarded !== state.pendingDiscardCount) return state; // Must discard exact amount

      const newState: SplendorGameState = {
        ...state,
        bank: newBank,
        players: {
          ...state.players,
          [playerId]: { ...player, gems: newPlayerGems }
        },
        turnState: 'take_tokens',
        pendingDiscardCount: 0,
        logs: [...state.logs, `${player.name} discarded ${Object.entries(discarded).filter(([_, v]) => v && v > 0).flatMap(([k, v]) => Array(v).fill(`[${k}]`)).join(' ')}`]
      };

      // Proceed to noble check / finish turn
      return scheduleBotIfNeeded(advanceTurnOrCheckNobles(newState, playerId));
    }

    case 'RESERVE_CARD_BOARD': {
      if (state.status !== 'Playing' || state.turnState !== 'take_tokens') return state;

      const playerId = state.playerOrder[state.currentPlayerIndex];
      const player = state.players[playerId];
      if (player.reservedCards.length >= 3) return state; // Cannot reserve more than 3

      const { tier, cardId } = action.payload;
      const tierKey = `tier${tier}` as 'tier1' | 'tier2' | 'tier3';
      const row = state.board[tierKey];
      const cardIndex = row.findIndex(c => c?.id === cardId);
      
      if (cardIndex === -1 || !row[cardIndex]) return state; // Card not found
      
      const card = row[cardIndex]!;
      const newRow = [...row];
      newRow[cardIndex] = null;

      let newBank = { ...state.bank };
      let newPlayerGems = { ...player.gems };
      let logs = [...state.logs, `${player.name} reserved a [${card.bonus}] tier ${tier} card`];

      if (newBank.gold > 0) {
        newBank.gold -= 1;
        newPlayerGems.gold += 1;
        logs.push(`${player.name} took 1 gold token`);
      }

      const tookGoldBoard = newBank.gold < state.bank.gold;
      let newState = {
        ...state,
        board: { ...state.board, [tierKey]: newRow },
        bank: newBank,
        players: {
          ...state.players,
          [playerId]: { 
            ...player, 
            reservedCards: [...player.reservedCards, card], 
            gems: newPlayerGems,
            stats: {
              ...(player.stats || emptyStats()),
              cardsReserved: ((player.stats?.cardsReserved) || 0) + 1,
              tokensCollected: ((player.stats?.tokensCollected) || 0) + (tookGoldBoard ? 1 : 0)
            }
          }
        },
        logs
      };

      newState = replenishBoard(newState);
      return scheduleBotIfNeeded(advanceTurnOrCheckNobles(newState, playerId));
    }

    case 'RESERVE_CARD_DECK': {
      if (state.status !== 'Playing' || state.turnState !== 'take_tokens') return state;

      const playerId = state.playerOrder[state.currentPlayerIndex];
      const player = state.players[playerId];
      if (player.reservedCards.length >= 3) return state; 

      const tierKey = `tier${action.payload.tier}` as 'tier1' | 'tier2' | 'tier3';
      const deck = state.decks[tierKey];
      if (deck.length === 0) return state;

      const newDeck = [...deck];
      const card = newDeck.shift()!;

      let newBank = { ...state.bank };
      let newPlayerGems = { ...player.gems };
      let logs = [...state.logs, `${player.name} reserved a tier ${action.payload.tier} card from the deck`];

      if (newBank.gold > 0) {
        newBank.gold -= 1;
        newPlayerGems.gold += 1;
      }

      const tookGoldDeck = newBank.gold < state.bank.gold;
      let newState = {
        ...state,
        decks: { ...state.decks, [tierKey]: newDeck },
        bank: newBank,
        players: {
          ...state.players,
          [playerId]: { 
            ...player, 
            reservedCards: [...player.reservedCards, card], 
            gems: newPlayerGems,
            stats: {
              ...(player.stats || emptyStats()),
              cardsReserved: ((player.stats?.cardsReserved) || 0) + 1,
              tokensCollected: ((player.stats?.tokensCollected) || 0) + (tookGoldDeck ? 1 : 0)
            }
          }
        },
        logs
      };

      return scheduleBotIfNeeded(advanceTurnOrCheckNobles(newState, playerId));
    }

    case 'PURCHASE_CARD_BOARD': {
      if (state.status !== 'Playing' || state.turnState !== 'take_tokens') return state;

      const playerId = state.playerOrder[state.currentPlayerIndex];
      const player = state.players[playerId];
      const { tier, cardId } = action.payload;
      const tierKey = `tier${tier}` as 'tier1' | 'tier2' | 'tier3';
      const row = state.board[tierKey];
      const cardIndex = row.findIndex(c => c?.id === cardId);
      
      if (cardIndex === -1 || !row[cardIndex]) return state; 
      
      const card = row[cardIndex]!;
      const payment = calculatePayment(player, card);
      if (!payment) return state; // Cannot afford

      const newRow = [...row];
      newRow[cardIndex] = null;

      const newBank = { ...state.bank };
      const newPlayerGems = { ...player.gems };
      for (const gem of Object.keys(payment) as GemType[]) {
        newBank[gem] += payment[gem];
        newPlayerGems[gem] -= payment[gem];
      }

      let newState = {
        ...state,
        board: { ...state.board, [tierKey]: newRow },
        bank: newBank,
        players: {
          ...state.players,
          [playerId]: { 
            ...player, 
            gems: newPlayerGems, 
            cards: [...player.cards, card],
            score: player.score + card.points,
            stats: {
              ...(player.stats || emptyStats()),
              cardsPurchased: ((player.stats?.cardsPurchased) || 0) + 1
            }
          }
        },
        logs: [...state.logs, `${player.name} purchased a [${card.bonus}] tier ${tier} card, earning ${card.points} points, using ${Object.entries(payment).filter(([_, v]) => v && v > 0).flatMap(([k, v]) => Array(v).fill(`[${k}]`)).join(' ') || 'free'}`]
      };

      newState = replenishBoard(newState);
      return scheduleBotIfNeeded(advanceTurnOrCheckNobles(newState, playerId));
    }

    case 'PURCHASE_RESERVED_CARD': {
      if (state.status !== 'Playing' || state.turnState !== 'take_tokens') return state;

      const playerId = state.playerOrder[state.currentPlayerIndex];
      const player = state.players[playerId];
      const cardIndex = player.reservedCards.findIndex(c => c.id === action.payload.cardId);
      
      if (cardIndex === -1) return state; 
      
      const card = player.reservedCards[cardIndex];
      const payment = calculatePayment(player, card);
      if (!payment) return state; 

      const newReserved = [...player.reservedCards];
      newReserved.splice(cardIndex, 1);

      const newBank = { ...state.bank };
      const newPlayerGems = { ...player.gems };
      for (const gem of Object.keys(payment) as GemType[]) {
        newBank[gem] += payment[gem];
        newPlayerGems[gem] -= payment[gem];
      }

      const newState = {
        ...state,
        bank: newBank,
        players: {
          ...state.players,
          [playerId]: { 
            ...player, 
            gems: newPlayerGems, 
            reservedCards: newReserved,
            cards: [...player.cards, card],
            score: player.score + card.points,
            stats: {
              ...(player.stats || emptyStats()),
              cardsPurchased: ((player.stats?.cardsPurchased) || 0) + 1
            }
          }
        },
        logs: [...state.logs, `${player.name} purchased a [${card.bonus}] reserved card, earning ${card.points} points, using ${Object.entries(payment).filter(([_, v]) => v && v > 0).flatMap(([k, v]) => Array(v).fill(`[${k}]`)).join(' ') || 'free'}`]
      };

      return scheduleBotIfNeeded(advanceTurnOrCheckNobles(newState, playerId));
    }

    case 'CHOOSE_NOBLE': {
      if (state.status !== 'Playing' || state.turnState !== 'choose_noble') return state;

      const playerId = state.playerOrder[state.currentPlayerIndex];
      const player = state.players[playerId];
      const noble = state.eligibleNoblesForCurrentPlayer.find(n => n.id === action.payload.nobleId);
      
      if (!noble) return state;

      const newState: SplendorGameState = {
        ...state,
        players: {
          ...state.players,
          [playerId]: {
            ...player,
            nobles: [...player.nobles, noble],
            score: player.score + noble.points,
            stats: {
              ...(player.stats || emptyStats()),
              noblesVisited: ((player.stats?.noblesVisited) || 0) + 1
            }
          }
        },
        nobles: state.nobles.filter(n => n.id !== noble.id),
        turnState: 'take_tokens',
        eligibleNoblesForCurrentPlayer: [],
        logs: [...state.logs, `${player.name} chose to be visited by a Noble!`]
      };

      return scheduleBotIfNeeded(finishTurn(newState, playerId));
    }

    
    case 'PLAY_BOT': {
      if (state.status !== 'Playing') return state;
      const playerId = state.playerOrder[state.currentPlayerIndex];
      const player = state.players[playerId];
      if (!player || !player.isBot) return state;

      const actionToTake = getBotAction(state, playerId);
      
      if (actionToTake) {
        return splendorReducer(state, actionToTake);
      } else {
         let newState: SplendorGameState = {
           ...state,
           logs: [...state.logs, `${player.name} passed their turn (nothing to do)`]
         };
         return scheduleBotIfNeeded(finishTurn(newState, playerId));
      }
    }

    default:
      return nextState;
  }
}
