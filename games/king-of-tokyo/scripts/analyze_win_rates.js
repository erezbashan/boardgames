const fs = require('fs');
const data = JSON.parse(fs.readFileSync('games/king-of-tokyo/src/bots/true_state_values.json', 'utf8'));

const statesToExamine = [
  "0_10_0", // Start of game
  "0_10_1", // Start of game, inside Tokyo
  "18_6_0", // Late game, outside Tokyo
  "18_6_1", // Late game, inside Tokyo
  "5_2_0",  // Low health, outside
  "5_2_1",  // Low health, inside
  "10_10_0", // Mid game, full health
  "10_10_1", // Mid game, full health, inside Tokyo
];

console.log("State Analysis (Win Rate %):\n");
const playerCounts = ["2", "4", "6"];

// Print header
let header = "State (VP_HLT_TOK)".padEnd(20);
for (let p of playerCounts) {
  header += `| ${p} Players `.padEnd(15);
}
console.log(header);
console.log("-".repeat(60));

for (let state of statesToExamine) {
  let row = state.padEnd(20);
  for (let p of playerCounts) {
    let val = data[p][state];
    let display = val !== undefined ? (val * 100).toFixed(1) + "%" : "N/A";
    row += `| ${display.padEnd(12)}`;
  }
  console.log(row);
}
