const fs = require('fs');
const code = fs.readFileSync('games/king-of-tokyo/scripts/post_turn_evaluator.ts', 'utf8');
console.log("Looking for bug in post_turn_evaluator");
