const fs = require('fs');

// 1. Rewrite ExactBot.ts
let exactBotCode = fs.readFileSync('games/king-of-tokyo/src/bots/ExactBot.ts', 'utf-8');

// Replace ASK_ROLL block
const rollStart = exactBotCode.indexOf("if (topAction.type === 'ASK_ROLL') {");
const rollEnd = exactBotCode.indexOf("if (topAction.type === 'ASK') {");
const newRollBlock = `if (topAction.type === 'ASK_ROLL') {
        const keptIds: string[] = [];
        let unlockedCount = state.dice.length;
        const rerollsLeft = (state.maxRolls || 3) - (state.rollCount || 0);

        let keptHearts = 0;
        let keptSmashes = 0;
        const inTokyo = player.location.startsWith('Tokyo');
        const tokyoOccupied = Object.values(state.players).some(p => p.health > 0 && p.location.startsWith('Tokyo'));

        state.dice.forEach(d => {
            if (d.kept) {
                keptIds.push(d.id);
                unlockedCount--;
                return;
            }
            let keep = false;
            if (d.value === 'Smash' && tactic.ATT) {
                if (tokyoOccupied || keptSmashes < 1) {
                    keep = true;
                    keptSmashes++;
                }
            } else if (d.value === 'Heart' && tactic.HLT && !inTokyo) {
                if (player.health + keptHearts < (state.settings?.maxHealth || 10) - 1) {
                    keep = true;
                    keptHearts++;
                }
            } else if (d.value === 'Energy' && tactic.ENR) {
                keep = true;
            }

            if (keep) {
                keptIds.push(d.id);
                unlockedCount--;
            }
        });

        if (tactic.VPS) {
            const counts: Record<string, number> = { '1': 0, '2': 0, '3': 0 };
            state.dice.forEach(d => {
                if (!keptIds.includes(d.id) && (d.value === '1' || d.value === '2' || d.value === '3')) {
                    counts[d.value]++;
                }
            });

            const keepValues = new Set<string>();
            if (counts['1'] >= 3) keepValues.add('1');
            if (counts['2'] >= 3) keepValues.add('2');
            if (counts['3'] >= 3) keepValues.add('3');

            const diceRerollsLeft = rerollsLeft * unlockedCount;

            if (counts['3'] === 2 && diceRerollsLeft >= 4) keepValues.add('3');
            if (counts['2'] === 2 && diceRerollsLeft >= 6) keepValues.add('2');

            state.dice.forEach(d => {
                if (!keptIds.includes(d.id) && keepValues.has(d.value)) {
                    keptIds.push(d.id);
                    unlockedCount--;
                }
            });
        }
        
        const rollsLeft = state.rollCount ?? 0;
        
        if (unlockedCount === 0 || rollsLeft <= 0) {
            return { type: 'RESPONSE_ROLL', payload: { roll: false }, playerId };
        } else {
            return { type: 'RESPONSE_ROLL', payload: { roll: true, keptDiceIds: keptIds }, playerId };
        }
    }

    `;
exactBotCode = exactBotCode.substring(0, rollStart) + newRollBlock + exactBotCode.substring(rollEnd);

// Replace ASK_MARKET block
const marketStart = exactBotCode.indexOf("if (topAction.type === 'ASK_MARKET') {");
const marketEnd = exactBotCode.indexOf("return null;", marketStart);
const newMarketBlock = `if (topAction.type === 'ASK_MARKET') {
        const energy = player.energy;
        let availableMarketCards = state.market
            .map((cardId, index) => ({ cardId, index }))
            .filter(c => c.cardId !== null && c.cardId !== undefined && c.cardId !== '');
            
        let affordableCards = availableMarketCards.filter(c => {
            // Need to require CARD_REGISTRY if we use it, or just do a simple heuristic
            // ExactBot doesn't have CARD_REGISTRY imported. Let's just buy the most expensive we can afford
            const cost = 5; // We can't access cardDef easily without import. 
            // I'll add the import!
            return true;
        });
        
        return { type: 'RESPONSE_MARKET', payload: { action: 'DONE' }, playerId };
    }
    `;

fs.writeFileSync('games/king-of-tokyo/src/bots/ExactBot.ts', exactBotCode);
