const fs = require('fs');
const data = JSON.parse(fs.readFileSync('games/king-of-tokyo/src/bots/optimized_tactics.json', 'utf8'));

const statesToExamine = [
  "0_10_0", // Start of game
  "5_2_0",  // Low health, outside
  "18_6_0", // Late game, outside Tokyo
  "18_6_1", // Late game, inside Tokyo
  "15_1_1", // Low health, inside Tokyo, mid-late game
];

for (let state of statesToExamine) {
  if (data[state]) {
    console.log(`State: ${state} -> Best Tactic:`, data[state].tactic, `(Expected Win%: ${(data[state].expectedWinRate * 100).toFixed(1)}%)`);
  }
}
