import type { GameState, Card, DiceRoll, DiceFace } from '@king-of-tokyo/shared';
import { marketCards } from '@king-of-tokyo/shared';

export function createInitialGameState(id: string, settings?: any): GameState {
  const gameSettings = settings || { maxHealth: 10, startingHealth: 10, startingEnergy: 0, winningVP: 20, startingDice: 6, copiesPerCard: 1, excludedCards: [] };
  const deck = shuffleDeck(gameSettings);
  const initialMarketCards = deck.splice(0, 3);
  return {
    id,
    players: {},
    playerOrder: [],
    currentTurnPlayerId: null,
    status: 'Lobby',
    winner: null,
    marketCards: initialMarketCards,
    deckCount: deck.length,
    deck,
    rollsLeft: 3,
    currentDice: [],
    isAnimating: false,
    highlightedDice: [],
    highlightedStats: [],
    pendingYields: [],
    logs: ['Game created'],
    settings: gameSettings
  };
}

export function shuffleDeck(settings?: any): Card[] {
  const excluded = settings?.excludedCards || [];
  const copies = settings?.copiesPerCard || 1;
  
  let baseCards = marketCards.filter(c => !excluded.includes(c.id));
  let finalDeck: Card[] = [];
  
  for (let i = 0; i < copies; i++) {
    const copyBatch = baseCards.map(c => ({
      ...c,
      id: i === 0 ? c.id : `${c.id}-copy${i}`
    }));
    finalDeck = finalDeck.concat(copyBatch);
  }

  return finalDeck.sort(() => Math.random() - 0.5);
}

export const FACES: DiceFace[] = ['1', '2', '3', 'Heart', 'Lightning', 'Claw'];

export function rollDice(count: number): DiceRoll[] {
  return Array.from({ length: count }).map(() => ({
    id: Math.random().toString(36).substring(7),
    face: FACES[Math.floor(Math.random() * FACES.length)],
    kept: false
  }));
}

export function evaluateDice(rolls: DiceRoll[]): { points: number, heal: number, energy: number, attack: number } {
  let points = 0;
  let heal = 0;
  let energy = 0;
  let attack = 0;
  
  const counts: Record<string, number> = { '1': 0, '2': 0, '3': 0, 'Heart': 0, 'Lightning': 0, 'Claw': 0 };
  rolls.forEach(r => counts[r.face]++);

  // Points for numbers
  ['1', '2', '3'].forEach(face => {
    if (counts[face] >= 3) {
      points += parseInt(face) + (counts[face] - 3);
    }
  });

  heal = counts['Heart'];
  energy = counts['Lightning'];
  attack = counts['Claw'];

  return { points, heal, energy, attack };
}
