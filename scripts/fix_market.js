const fs = require('fs');

let exactBotCode = fs.readFileSync('games/king-of-tokyo/src/bots/ExactBot.ts', 'utf-8');

// Add import if not present
if (!exactBotCode.includes("CARD_REGISTRY")) {
    exactBotCode = "import { CARD_REGISTRY } from '../engine/cards/registry';\n" + exactBotCode;
}

const marketStart = exactBotCode.indexOf("if (topAction.type === 'ASK_MARKET') {");
const marketEnd = exactBotCode.indexOf("return null;", marketStart);

const newMarketBlock = `if (topAction.type === 'ASK_MARKET') {
        const energy = player.energy;
        let availableMarketCards = state.market
            .map((cardId, index) => ({ cardId, index }))
            .filter(c => c.cardId !== null && c.cardId !== undefined && c.cardId !== '');
            
        let affordableCards = availableMarketCards.filter(c => {
            const cardDef = CARD_REGISTRY[c.cardId];
            if (!cardDef) return false;
            if (cardDef.type === 'Keep' && player.cards.includes(c.cardId)) return false;
            let cost = cardDef.cost;
            if (state.turnContext?.buyDiscount) {
                cost = Math.max(0, cost - state.turnContext.buyDiscount);
            }
            return energy >= cost;
        });

        affordableCards.sort((a, b) => {
            const costA = CARD_REGISTRY[a.cardId]?.cost || 0;
            const costB = CARD_REGISTRY[b.cardId]?.cost || 0;
            return costB - costA; // highest cost first
        });

        for (const card of affordableCards) {
            const cost = CARD_REGISTRY[card.cardId]?.cost || 0;
            const chance = (cost - 2) / 8; // exactly the same heuristic as BucketBot
            if (Math.random() <= chance) {
                return { type: 'RESPONSE_MARKET', payload: { action: 'BUY', cardId: card.cardId, marketIndex: card.index }, playerId };
            }
        }
        
        return { type: 'RESPONSE_MARKET', payload: { action: 'DONE' }, playerId };
    }
    
    `;

if (marketStart !== -1 && marketEnd !== -1) {
    exactBotCode = exactBotCode.substring(0, marketStart) + newMarketBlock + exactBotCode.substring(marketEnd);
}

fs.writeFileSync('games/king-of-tokyo/src/bots/ExactBot.ts', exactBotCode);
