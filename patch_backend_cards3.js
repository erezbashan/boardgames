const fs = require('fs');

const cards = `  { id: 'c21', name: 'Alien Metabolism', cost: 3, type: 'Keep', description: 'Buying cards costs 1 less energy.', effect: { alienMetabolism: true } },
  { id: 'c22', name: 'Giant Brain', cost: 5, type: 'Keep', description: 'Get 1 extra reroll per turn.', effect: { giantBrain: true } },
  { id: 'c23', name: 'Omnivore', cost: 4, type: 'Keep', description: 'Once per turn, if you score points from dice, gain 2 extra VP.', effect: { omnivore: true } },
  { id: 'c24', name: 'Poison Quills', cost: 3, type: 'Keep', description: 'When you deal damage, the target loses 1 energy.', effect: { poisonQuills: true } },
  { id: 'c25', name: 'Dedicated News Team', cost: 3, type: 'Keep', description: 'Gain 1 VP whenever you buy a card.', effect: { newsTeam: true } },
  { id: 'c26', name: 'Herbivore', cost: 5, type: 'Keep', description: 'If you deal 0 damage on your turn, gain 1 VP.', effect: { herbivore: true } },
  { id: 'c27', name: 'Rapid Healing', cost: 3, type: 'Keep', description: 'Heal 1 damage at the start of your turn.', effect: { rapidHealing: true } },
  { id: 'c28', name: 'Evacuation Orders', cost: 7, type: 'Discard', description: 'All other players lose 5 VP.', effect: { evacuation: true } },
  { id: 'c29', name: 'High Altitude Bombing', cost: 4, type: 'Discard', description: 'Deal 3 damage to ALL players (including yourself).', effect: { highAltitude: true } },
  { id: 'c30', name: 'Spiked Armor', cost: 4, type: 'Keep', description: 'When you are attacked and take damage, the attacker takes 1 damage.', effect: { spikedArmor: true } },
];`;

let logic = fs.readFileSync('backend/src/gameLogic.ts', 'utf8');
logic = logic.replace(
  `];`,
  cards
);
fs.writeFileSync('backend/src/gameLogic.ts', logic, 'utf8');

// Also update initial default settings
logic = fs.readFileSync('backend/src/gameLogic.ts', 'utf8');
logic = logic.replace(
  `{ maxHealth: 10, startingHealth: 10, winningVP: 20 }`,
  `{ maxHealth: 10, startingHealth: 10, winningVP: 20, startingDice: 6 }`
);
fs.writeFileSync('backend/src/gameLogic.ts', logic, 'utf8');

