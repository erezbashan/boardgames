const fs = require('fs');

let exactBot = fs.readFileSync('games/king-of-tokyo/src/bots/ExactBot.ts', 'utf-8');
// Cut out the mangled part entirely
const start = exactBot.indexOf("let keep = false;");
const end = exactBot.indexOf("if (d.value === 'Smash' && tactic.ATT) keep = true;");
if (start !== -1 && end !== -1) {
    exactBot = exactBot.substring(0, start) + 
`let keep = false;
            if (['1', '2', '3'].includes(d.value) && tactic.VPS) {
                const count = state.dice.filter(x => x.value === d.value).length;
                if (count >= 2 || (d.value === '3' && count >= 1)) keep = true;
            }
            ` + exactBot.substring(end);
}
fs.writeFileSync('games/king-of-tokyo/src/bots/ExactBot.ts', exactBot);

let baker = fs.readFileSync('games/king-of-tokyo/scripts/exact_tactics_baker.ts', 'utf-8');
const start2 = baker.indexOf("let val = dice[i];");
const end2 = baker.indexOf("if (val === 'Smash' && tactic.ATT) keep = true;");
if (start2 !== -1 && end2 !== -1) {
    baker = baker.substring(0, start2) + 
`let val = dice[i];
            if (['1', '2', '3'].includes(val) && tactic.VPS) {
                const count = dice.filter(x => x === val).length;
                if (count >= 2 || (val === '3' && count >= 1)) keep = true;
            }
            ` + baker.substring(end2);
}
fs.writeFileSync('games/king-of-tokyo/scripts/exact_tactics_baker.ts', baker);
