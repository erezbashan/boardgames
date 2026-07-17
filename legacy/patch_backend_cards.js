const fs = require('fs');
let content = fs.readFileSync('backend/src/gameLogic.ts', 'utf8');

// The existing deck has 10 cards (c1 to c10).
// Let's add 10 new cards (c11 to c20).

const newCards = `  { id: 'c11', name: 'Shrink Ray', cost: 6, type: 'Keep', description: 'When you deal damage, give a Shrink token. Shrink tokens reduce dice rolled by 1.', effect: { shrinkRay: true } },
  { id: 'c12', name: 'Jetpack', cost: 5, type: 'Keep', description: 'You suffer no damage when yielding Tokyo.', effect: { jetpack: true } },
  { id: 'c13', name: 'Energy Hoarder', cost: 3, type: 'Keep', description: 'Gain 1 extra energy every time you gain energy from dice.', effect: { energyHoarder: true } },
  { id: 'c14', name: 'Regeneration', cost: 4, type: 'Keep', description: 'When you heal using hearts, heal 1 extra health.', effect: { regeneration: true } },
  { id: 'c15', name: 'Frenzy', cost: 7, type: 'Discard', description: 'Immediately gain an Extra Turn after your current turn ends.', effect: { frenzy: true } },
  { id: 'c16', name: 'Evade', cost: 4, type: 'Keep', description: 'The next time you take damage, ignore it completely and discard this card.', effect: { evade: true } },
  { id: 'c17', name: 'Spiked Tail', cost: 4, type: 'Discard', description: 'Deal 2 damage immediately to all other players.', effect: { spikeDamage: 2 } },
  { id: 'c18', name: 'Solar Powered', cost: 3, type: 'Keep', description: 'At the start of your turn, if you have 0 energy, gain 1 energy.', effect: { solarPowered: true } },
  { id: 'c19', name: 'Parasitic Tentacles', cost: 5, type: 'Keep', description: 'When you deal damage to a player, heal 1 health.', effect: { parasitic: true } },
  { id: 'c20', name: 'Alpha Monster', cost: 6, type: 'Keep', description: 'Gain 1 VP every time you deal damage.', effect: { alphaMonster: true } },
`;

content = content.replace(
  `  { id: 'c10', name: 'Armor', cost: 5, type: 'Keep', description: 'Ignore 1 damage when attacked.', effect: { armor: 1 } },
];`,
  `  { id: 'c10', name: 'Armor', cost: 5, type: 'Keep', description: 'Ignore 1 damage when attacked.', effect: { armor: 1 } },
` + newCards + `];`
);

fs.writeFileSync('backend/src/gameLogic.ts', content, 'utf8');
