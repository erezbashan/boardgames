import { GameState, Player, Card, DiceRoll, DiceFace, PlayerId, MAX_HEALTH, WIN_VP } from '@king-of-tokyo/shared';

// Basic deck of 10 simple cards for MVP
export const INITIAL_DECK: Card[] = [
  { id: 'c1', name: 'Even Bigger', cost: 4, type: 'Keep', description: '+2 Max Health (and +2 Health)', effect: { maxHealth: 2, heal: 2 } },
  { id: 'c2', name: 'Nova Breath', cost: 7, type: 'Keep', description: 'Your attacks damage ALL other players', effect: { aoeAttack: true } },
  { id: 'c3', name: 'Extra Head', cost: 7, type: 'Keep', description: 'Roll 1 extra die', effect: { extraDie: 1 } },
  { id: 'c4', name: 'Fire Breathing', cost: 4, type: 'Keep', description: 'Neighbors take 1 extra damage', effect: { fireBreathing: true } },
  { id: 'c5', name: 'Heal', cost: 3, type: 'Discard', description: 'Heal 2 damage', effect: { heal: 2 } },
  { id: 'c6', name: 'Energy Hoard', cost: 3, type: 'Discard', description: 'Gain 6 energy', effect: { energy: 6 } },
  { id: 'c7', name: 'Points', cost: 4, type: 'Discard', description: 'Gain 2 VP', effect: { vp: 2 } },
  { id: 'c8', name: 'More Points', cost: 8, type: 'Discard', description: 'Gain 4 VP', effect: { vp: 4 } },
  { id: 'c9', name: 'Poison Spit', cost: 4, type: 'Keep', description: 'When you deal damage, give a Poison token. Poison deals 1 damage at the start of their turn. ❤️ cures Poison before healing.', effect: { poison: true } },
  { id: 'c10', name: 'Armor', cost: 5, type: 'Keep', description: 'Ignore 1 damage when attacked. (Reduces all incoming attack damage by 1).', effect: { armor: 1 } },
];

export function createInitialGameState(id: string): GameState {
  const deck = shuffleDeck();
  const marketCards = deck.splice(0, 3);
  return {
    id,
    players: {},
    playerOrder: [],
    currentTurnPlayerId: null,
    status: 'Lobby',
    winner: null,
    marketCards,
    deckCount: deck.length,
    deck,
    rollsLeft: 3,
    currentDice: [],
    isAnimating: false,
    highlightedDice: [],
    highlightedStats: [],
    pendingYields: [],
    logs: ['Game created'],
  };
}

export function shuffleDeck(): Card[] {
  return [...INITIAL_DECK].sort(() => Math.random() - 0.5);
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
