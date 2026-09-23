const fs = require('fs');
const data = JSON.parse(fs.readFileSync('games/king-of-tokyo/src/bots/true_state_values.json', 'utf8'));

const statesToExamine = [
  "18_2_0", // High VP, low health, outside
  "18_2_1", // High VP, low health, inside
];

console.log("State Analysis (Win Rate %):\n");
const playerCounts = ["2", "4", "6"];
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
