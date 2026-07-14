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
  { id: 'c10', name: 'Armor', cost: 5, type: 'Keep', description: 'Ignore 1 damage when attacked.', effect: { armor: 1 } },
  { id: 'c11', name: 'Shrink Ray', cost: 6, type: 'Keep', description: 'When you deal damage, give a Shrink token. Shrink tokens reduce dice rolled by 1.', effect: { shrinkRay: true } },
  { id: 'c12', name: 'Jetpack', cost: 5, type: 'Keep', description: 'Gain 2 Energy when you yield Tokyo.', effect: { jetpack: true } },
  { id: 'c13', name: 'Energy Hoarder', cost: 3, type: 'Keep', description: 'Gain 1 extra energy every time you gain energy from dice.', effect: { energyHoarder: true } },
  { id: 'c14', name: 'Regeneration', cost: 4, type: 'Keep', description: 'When you heal using hearts, heal 1 extra health.', effect: { regeneration: true } },
  { id: 'c15', name: 'Frenzy', cost: 7, type: 'Discard', description: 'Immediately gain an Extra Turn after your current turn ends.', effect: { frenzy: true } },
  { id: 'c16', name: 'Evade', cost: 4, type: 'Keep', description: 'The next time you take damage, ignore it completely and discard this card.', effect: { evade: true } },
  { id: 'c17', name: 'Spiked Tail', cost: 4, type: 'Discard', description: 'Deal 2 damage immediately to all other players.', effect: { spikeDamage: 2 } },
  { id: 'c18', name: 'Solar Powered', cost: 3, type: 'Keep', description: 'At the start of your turn, if you have 0 energy, gain 1 energy.', effect: { solarPowered: true } },
  { id: 'c19', name: 'Parasitic Tentacles', cost: 5, type: 'Keep', description: 'When you deal damage to a player, heal 1 health.', effect: { parasitic: true } },
  { id: 'c20', name: 'Alpha Monster', cost: 6, type: 'Keep', description: 'Gain 1 VP every time you deal damage.', effect: { alphaMonster: true } },
  { id: 'c21', name: 'Alien Metabolism', cost: 3, type: 'Keep', description: 'Buying cards costs 1 less energy.', effect: { alienMetabolism: true } },
  { id: 'c22', name: 'Giant Brain', cost: 5, type: 'Keep', description: 'Get 1 extra reroll per turn.', effect: { giantBrain: true } },
  { id: 'c23', name: 'Omnivore', cost: 4, type: 'Keep', description: 'Once per turn, if you score points from dice, gain 2 extra VP.', effect: { omnivore: true } },
  { id: 'c24', name: 'Poison Quills', cost: 3, type: 'Keep', description: 'When you deal damage, the target loses 1 energy.', effect: { poisonQuills: true } },
  { id: 'c25', name: 'Dedicated News Team', cost: 3, type: 'Keep', description: 'Gain 1 VP whenever you buy a card.', effect: { newsTeam: true } },
  { id: 'c26', name: 'Herbivore', cost: 5, type: 'Keep', description: 'If you deal 0 damage on your turn, gain 1 VP.', effect: { herbivore: true } },
  { id: 'c27', name: 'Rapid Healing', cost: 3, type: 'Keep', description: 'Heal 1 damage at the start of your turn.', effect: { rapidHealing: true } },
  { id: 'c28', name: 'Evacuation Orders', cost: 7, type: 'Discard', description: 'All other players lose 5 VP.', effect: { evacuation: true } },
  { id: 'c29', name: 'High Altitude Bombing', cost: 4, type: 'Discard', description: 'Deal 3 damage to ALL players (including yourself).', effect: { highAltitude: true } },
  { id: 'c30', name: 'Spiked Armor', cost: 4, type: 'Keep', description: 'When you are attacked and take damage, the attacker takes 1 damage.', effect: { spikedArmor: true } },
];

export function createInitialGameState(id: string, settings?: any): GameState {
  const gameSettings = settings || { maxHealth: 10, startingHealth: 10, winningVP: 20, startingDice: 6 };
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
    settings: gameSettings
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
