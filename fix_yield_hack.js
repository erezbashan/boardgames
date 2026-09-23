const fs = require('fs');
let exactBotCode = fs.readFileSync('games/king-of-tokyo/src/bots/ExactBot.ts', 'utf-8');

const yieldIndex = exactBotCode.indexOf("if (text.includes('yield Tokyo')) {");
if (yieldIndex !== -1 && !exactBotCode.includes("USER HACK")) {
    const replacement = `if (text.includes('yield Tokyo')) {
            // USER HACK: If in Tokyo, and have 18 points or more, and your turn is next, never yield.
            const aliveOrder = state.playerOrder.filter(p => state.players[p].health > 0);
            const myIdx = aliveOrder.indexOf(playerId);
            let activeIdx = aliveOrder.indexOf(state.playerOrder[state.currentPlayerIndex]);
            if (activeIdx === -1) activeIdx = myIdx;
            const turnsToMe = (myIdx - activeIdx + aliveOrder.length) % aliveOrder.length;
            
            if (player.vp >= 18 && turnsToMe === 1) {
                const options = topAction.payload.prompt.options as any[];
                if (options.some(o => o.label === 'Stay')) {
                    return options.find(o => o.label === 'Stay').action;
                }
            }`;
    exactBotCode = exactBotCode.replace("if (text.includes('yield Tokyo')) {", replacement);
    fs.writeFileSync('games/king-of-tokyo/src/bots/ExactBot.ts', exactBotCode);
}
