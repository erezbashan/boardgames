export type PlayerId = string;

export interface Player {
  id: PlayerId;
  name: string;
  color?: string;
  isBot: boolean;
  health: number;    // max 10 (usually 12 with some cards)
  maxHealth?: number; // defaults to 10
  victoryPoints: number; // max 20
  energy: number;
  inTokyo: boolean;
  inTokyoBay?: boolean;
  cards: Card[];
  hasYielded?: boolean; // temporary flag during resolution
  poisonTokens: number;
  shrinkTokens: number;
  dealtDamageThisTurn?: boolean;
  hasFrenzy?: boolean;
  gameStats?: {
    damageDealt: number;
    playersKilled: number;
    cardsBought: number;
    energySpent: number;
    energyGained: number;
    healingGained: number;
    vpFromDice?: number;
    vpFromEnteringTokyo?: number;
    vpFromStartingTokyo?: number;
    vpFromOther?: number;
    vpFromCards?: number;
    turnDied?: number;
  };
  flags?: Record<string, any>;
}

export type DiceFace = '1' | '2' | '3' | 'Heart' | 'Lightning' | 'Claw';

export interface DiceRoll {
  id: string;
  face: DiceFace;
  kept: boolean;
}

export interface CardEffect {
  maxHealth?: number;
  heal?: number;
  aoeAttack?: boolean;
  extraDie?: number;
  fireBreathing?: boolean;
  energy?: number;
  vp?: number;
  poison?: boolean;
  armor?: number;
  shrinkRay?: boolean;
  jetpack?: boolean;
  energyHoarder?: boolean;
  regeneration?: boolean;
  frenzy?: boolean;
  evade?: boolean;
  spikeDamage?: number;
  solarPowered?: boolean;
  parasitic?: boolean;
  alphaMonster?: boolean;
  alienMetabolism?: boolean;
  giantBrain?: boolean;
  omnivore?: boolean;
  poisonQuills?: boolean;
  newsTeam?: boolean;
  herbivore?: boolean;
  rapidHealing?: boolean;
  evacuation?: boolean;
  highAltitude?: boolean;
  spikedArmor?: boolean;
  wings?: boolean;
  gourmet?: boolean;
  backgroundDweller?: boolean;
  friendOfChildren?: boolean;
  gasRefinery?: boolean;
  nuclearPowerPlant?: boolean;
  skyscrapers?: boolean;
  cornerStore?: boolean;
  energize?: boolean;
  apartmentBuilding?: boolean;
  commuterTrain?: boolean;
  nationalGuard?: boolean;
  fighterSquadron?: boolean;
  rootingForTheUnderdog?: boolean;
  weAreOnlyMakingItStronger?: boolean;
  poisonousSpit?: boolean;
  urbavore?: boolean;
  vastStorm?: boolean;
}

export interface Card {
  id: string;
  name: string;
  cost: number;
  type: 'Keep' | 'Discard';
  description: string;
  effect: CardEffect;
}

export interface TurnHistory {
  turnNumber: number;
  playerId: string;
  vp: number;
  health: number;
  energy: number;
  inTokyo?: boolean;
  inTokyoBay?: boolean;
  tokyoPlayerId?: string | null; // Keep for backwards compatibility with old games
}

export interface GameState {
  id: string;
  players: Record<PlayerId, Player>;
  playerOrder: PlayerId[];
  currentTurnPlayerId: PlayerId | null;
  status: 'Lobby' | 'Playing' | 'GameOver';
  winner: PlayerId | null;
  marketCards: Card[];
  deckCount: number;
  deck: Card[];
  
  // Turn state
  rollsLeft: number;
  currentDice: DiceRoll[];
  
  // Animation state
  isAnimating: boolean;
  highlightedDice: string[];
  highlightedStats: { playerId: PlayerId, stat: string, dir?: 'up' | 'down' }[];
  
  // Resolution state
  pendingYields: PlayerId[]; // players asked if they want to yield Tokyo
  pendingPrompts?: { playerId: string, cardId: string, promptId: string, question: string, options: { label: string, value: string, buttonClass?: string }[] }[];
  pendingWings?: PlayerId[]; // players asked if they want to spend 2 energy to ignore damage
  playerDecisions?: Record<PlayerId, { type: 'Yield' | 'Wings', choice: boolean }>;
  flags?: Record<string, any>;
  logs: string[];
  chatMessages?: { sender: string, text: string }[];
  history?: TurnHistory[];
  settings: {
    maxHealth: number;
    startingHealth: number;
    startingEnergy?: number;
    winningVP: number;
    startingDice?: number;
    copiesPerCard?: number;
    excludedCards?: string[];
  };
}

export const MAX_HEALTH = 10;
export const WIN_VP = 20;

export const SOCKET_EVENTS = {
  // Client to Server
  CREATE_GAME: 'CREATE_GAME',
  JOIN_GAME: 'JOIN_GAME',
  QUIT_GAME: 'QUIT_GAME',
  ADD_BOT: 'ADD_BOT',
  START_GAME: 'START_GAME',
  RESTART_GAME: 'RESTART_GAME',
  RETURN_TO_LOBBY: 'RETURN_TO_LOBBY',
  ROLL_DICE: 'ROLL_DICE',
  KEEP_DICE: 'KEEP_DICE',
  RESOLVE_DICE: 'RESOLVE_DICE',
  YIELD_TOKYO: 'YIELD_TOKYO',
  BUY_CARD: 'BUY_CARD',
  END_TURN: 'END_TURN',
  ADD_CHAT_MESSAGE: 'ADD_CHAT_MESSAGE',
  SEND_CHAT: 'SEND_CHAT',
  REJOIN_GAME: 'REJOIN_GAME',
  SWEEP_CARDS: 'SWEEP_CARDS',
  
  // Server to Client
  GAME_STATE_UPDATE: 'GAME_STATE_UPDATE',
  ERROR: 'ERROR',
  GAMES_LIST: 'GAMES_LIST',
};

export * from './cards/types';
export * from './cards/index';

export const marketCards: Card[] = [
  { id: 'c1', name: 'Even Bigger', cost: 4, type: 'Keep', description: '+2 Max Health (and +2 Health)', effect: { maxHealth: 2, heal: 2 } },
  { id: 'c2', name: 'Nova Breath', cost: 7, type: 'Keep', description: 'Your attacks damage ALL other players', effect: { aoeAttack: true } },
  { id: 'c3', name: 'Extra Head', cost: 7, type: 'Keep', description: 'Roll 1 extra die', effect: { extraDie: 1 } },
  { id: 'c4', name: 'Fire Breathing', cost: 4, type: 'Keep', description: 'Neighbors take 1 extra damage', effect: { fireBreathing: true } },
  { id: 'c5', name: 'Heal', cost: 3, type: 'Discard', description: 'Heal 2 damage', effect: { heal: 2 } },
  { id: 'c6', name: 'Energy Hoard', cost: 3, type: 'Discard', description: 'Gain 6 energy', effect: { energy: 6 } },
  { id: 'c7', name: 'Points', cost: 4, type: 'Discard', description: 'Gain 2 VP', effect: { vp: 2 } },
  { id: 'c8', name: 'More Points', cost: 8, type: 'Discard', description: 'Gain 4 VP', effect: { vp: 4 } },
  { id: 'c9', name: 'Poison Spit', cost: 4, type: 'Keep', description: 'When you deal damage, give a Poison token. Poison deals 1 damage at the start of their turn. ❤️ cures Poison before healing.', effect: { poison: true } },
  { id: 'c10', name: 'Armor Plating', cost: 4, type: 'Keep', description: 'Ignore damage of 1.', effect: { armor: 1 } },
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
  { id: 'c23', name: 'Omnivore', cost: 4, type: 'Keep', description: 'Once per turn, score 2 VP if your dice contain at least a 1, a 2, and a 3.', effect: { omnivore: true } },
  { id: 'c24', name: 'Poison Quills', cost: 3, type: 'Keep', description: 'When you deal damage, the target loses 1 energy.', effect: { poisonQuills: true } },
  { id: 'c25', name: 'Dedicated News Team', cost: 3, type: 'Keep', description: 'Gain 1 VP whenever you buy a card.', effect: { newsTeam: true } },
  { id: 'c26', name: 'Herbivore', cost: 5, type: 'Keep', description: 'If you deal 0 damage on your turn, gain 1 VP.', effect: { herbivore: true } },
  { id: 'c27', name: 'Rapid Healing', cost: 3, type: 'Keep', description: 'Heal 1 damage at the start of your turn.', effect: { rapidHealing: true } },
  { id: 'c28', name: 'Evacuation Orders', cost: 7, type: 'Discard', description: 'All other players lose 5 VP.', effect: { evacuation: true } },
  { id: 'c29', name: 'High Altitude Bombing', cost: 4, type: 'Discard', description: 'Deal 3 damage to ALL players (including yourself).', effect: { highAltitude: true } },
  { id: 'c30', name: 'Spiked Armor', cost: 4, type: 'Keep', description: 'When you are attacked and take damage, the attacker takes 1 damage.', effect: { spikedArmor: true } },
  // ADD NEW CARDS HERE
  { id: 'c31', name: 'Wings', cost: 6, type: 'Keep', description: 'Spend 2 Energy to ignore damage for one turn.', effect: { wings: true } },
  { id: 'c32', name: 'Gourmet', cost: 4, type: 'Keep', description: 'When scoring 1, 1, 1, you score 2 extra VP.', effect: { gourmet: true } },
  { id: 'c33', name: 'Background Dweller', cost: 4, type: 'Keep', description: 'You can always reroll any 3s you have.', effect: { backgroundDweller: true } },
  { id: 'c34', name: 'Friend of Children', cost: 3, type: 'Keep', description: 'When gaining Energy, gain 1 extra.', effect: { friendOfChildren: true } },
  { id: 'c35', name: 'Gas Refinery', cost: 6, type: 'Discard', description: 'Gain 2 VP and deal 3 damage to all other players.', effect: { vp: 2, spikeDamage: 3 } },
  { id: 'c36', name: 'Nuclear Power Plant', cost: 6, type: 'Discard', description: 'Gain 2 VP and heal 3 Health.', effect: { heal: 3, vp: 2 } },
  { id: 'c37', name: 'Skyscrapers', cost: 6, type: 'Discard', description: 'Gain 4 VP.', effect: { vp: 4 } },
  { id: 'c38', name: 'Corner Store', cost: 3, type: 'Discard', description: 'Gain 1 VP.', effect: { vp: 1 } },
  { id: 'c39', name: 'Energize', cost: 4, type: 'Discard', description: 'Gain 9 energy.', effect: { energy: 9 } },
  { id: 'c40', name: 'Apartment Building', cost: 5, type: 'Discard', description: 'Gain 3 VP.', effect: { vp: 3 } },
  { id: 'c41', name: 'Commuter Train', cost: 4, type: 'Discard', description: 'Gain 2 VP.', effect: { vp: 2 } },
  { id: 'c42', name: 'National Guard', cost: 3, type: 'Discard', description: 'Gain 2 VP and take 2 damage.', effect: { vp: 2, spikeDamage: 0 } }, // Needs custom logic or just vp and health loss
  { id: 'c43', name: 'Fighter Squadron', cost: 5, type: 'Discard', description: 'Deal 2 damage to all other players.', effect: { spikeDamage: 2 } },
  { id: 'c44', name: 'Rooting For The Underdog', cost: 3, type: 'Keep', description: 'Gain 1 VP at the end of your turn if you have the lowest VP.', effect: { rootingForTheUnderdog: true } },
  { id: 'c45', name: 'We\'re Only Making It Stronger', cost: 3, type: 'Keep', description: 'Gain 1 Energy when you take 2 or more damage.', effect: { weAreOnlyMakingItStronger: true } },
  { id: 'c46', name: 'Urbavore', cost: 4, type: 'Keep', description: 'Gain 1 extra VP when starting turn in Tokyo. Deal 1 extra damage from Tokyo.', effect: { urbavore: true } },
  { id: 'c47', name: 'Vast Storm', cost: 6, type: 'Discard', description: 'Gain 2 VP. All other monsters lose 2 Energy.', effect: { vp: 2, spikeDamage: 0 } }
];
export * from './cards/index';
