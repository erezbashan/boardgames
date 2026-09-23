const fs = require('fs');
let exactBotCode = fs.readFileSync('games/king-of-tokyo/src/bots/ExactBot.ts', 'utf-8');

if (!exactBotCode.includes("import { getRandomBotAction }")) {
    exactBotCode = "import { getActionFromRandomBot as getRandomBotAction } from './RandomBot';\n" + exactBotCode;
}

if (!exactBotCode.includes("return getRandomBotAction(state, playerId);")) {
    exactBotCode = exactBotCode.replace("return null;\n}", "return getRandomBotAction(state, playerId);\n}");
    fs.writeFileSync('games/king-of-tokyo/src/bots/ExactBot.ts', exactBotCode);
}
