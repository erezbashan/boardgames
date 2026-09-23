const fs = require('fs');
const preTurn = JSON.parse(fs.readFileSync('games/king-of-tokyo/src/bots/true_state_values.json', 'utf8'))['2'];
const postTurn = JSON.parse(fs.readFileSync('games/king-of-tokyo/src/bots/post_turn_values.json', 'utf8'));

console.log("Win% in Tokyo (Pre-Turn vs Post-Turn):");
const testStates = ["0_10_1", "5_5_1", "10_10_1", "15_5_1", "18_6_1", "3_3_1"];

for (const state of testStates) {
    const pre = preTurn[state] !== undefined ? (preTurn[state] * 100).toFixed(1) + "%" : "N/A";
    const post = postTurn[state] !== undefined ? (postTurn[state] * 100).toFixed(1) + "%" : "N/A";
    console.log(`State ${state.padEnd(8)} | Pre-Turn (Start of Turn): ${pre.padEnd(6)} | Post-Turn (End of Turn): ${post.padEnd(6)}`);
}
