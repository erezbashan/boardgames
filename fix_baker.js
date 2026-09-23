const fs = require('fs');

let bakerCode = fs.readFileSync('games/king-of-tokyo/scripts/exact_tactics_baker.ts', 'utf-8');

const simStart = bakerCode.indexOf("function simulateTurn");
const simEnd = bakerCode.indexOf("console.log(\"Baking Tactics");

const newSimTurn = `function simulateTurn(mVp: number, mHlt: number, oVp: number, oHlt: number, tok: number, tactic: any): number {
    let start_mVp = mVp;
    if (tok === 1) {
        start_mVp = Math.min(20, start_mVp + 2);
        if (start_mVp >= 20) return 1.0;
    }
    
    let dice = [randomRoll(), randomRoll(), randomRoll(), randomRoll(), randomRoll(), randomRoll()];
    let keptHearts = 0;
    let keptSmashes = 0;
    
    for (let roll = 1; roll < 3; roll++) {
        let keptDice = [];
        let unlockedCount = 6;
        let rerollsLeft = 3 - roll;
        
        let counts: Record<string, number> = { '1': 0, '2': 0, '3': 0 };
        dice.forEach(d => {
            if (['1', '2', '3'].includes(d)) counts[d]++;
        });
        
        const keepValues = new Set<string>();
        if (counts['1'] >= 3) keepValues.add('1');
        if (counts['2'] >= 3) keepValues.add('2');
        if (counts['3'] >= 3) keepValues.add('3');
        
        const diceRerollsLeft = rerollsLeft * unlockedCount;
        if (counts['3'] === 2 && diceRerollsLeft >= 4) keepValues.add('3');
        if (counts['2'] === 2 && diceRerollsLeft >= 6) keepValues.add('2');

        for (let i = 0; i < 6; i++) {
            let val = dice[i];
            let keep = false;
            
            // BucketBot logic:
            if (val === 'Smash' && tactic.ATT) {
                // In exact state table for 2-player, tok === 1 means Opponent is Outside (so Tokyo is Occupied by ME)
                // tok === 0 means I am Outside, and Opponent is Inside (so Tokyo is Occupied by OPPONENT)
                // So in 2-player exact table mid-game, Tokyo is ALWAYS OCCUPIED!
                keep = true;
            } else if (val === 'Heart' && tactic.HLT && tok === 0) {
                if (mHlt + keptHearts < 9) { // 10 - 1 = 9
                    keep = true;
                    keptHearts++;
                }
            } else if (val === 'Energy' && tactic.ENR) {
                keep = true;
            }
            
            if (!keep && ['1', '2', '3'].includes(val) && tactic.VPS) {
                if (keepValues.has(val)) keep = true;
            }
            
            if (keep) {
                keptDice.push(val);
                unlockedCount--;
            }
        }
        
        let newDice = [...keptDice];
        for (let i = 0; i < unlockedCount; i++) {
            newDice.push(randomRoll());
        }
        dice = newDice;
    }
    
    let counts: any = {};
    dice.forEach(d => counts[d] = (counts[d] || 0) + 1);
    
    let next_mVp = start_mVp;
    if (counts['1'] >= 3) next_mVp += 1 + (counts['1'] - 3);
    if (counts['2'] >= 3) next_mVp += 2 + (counts['2'] - 3);
    if (counts['3'] >= 3) next_mVp += 3 + (counts['3'] - 3);
    next_mVp = Math.min(20, next_mVp);
    if (next_mVp >= 20) return 1.0;
    
    let next_mHlt = mHlt;
    if (tok === 0 && counts['Heart']) {
        next_mHlt = Math.min(10, next_mHlt + counts['Heart']);
    }
    
    let dmg = counts['Smash'] || 0;
    let next_oHlt = oHlt;
    
    if (tok === 1) {
        next_oHlt = Math.max(0, next_oHlt - dmg);
        if (next_oHlt === 0) return 1.0;
    } else {
        if (dmg > 0) {
            next_oHlt = Math.max(0, next_oHlt - dmg);
            if (next_oHlt === 0) return 1.0;
            
            let yield_mVp = Math.min(20, next_mVp + 1);
            let val_yield = 1.0;
            if (yield_mVp < 20) {
                val_yield = 1.0 - getV(oVp, next_oHlt, yield_mVp, next_mHlt, 0); 
            }
            let val_stay = 1.0 - getV(oVp, next_oHlt, next_mVp, next_mHlt, 1);
            return Math.min(val_yield, val_stay);
        }
    }
    
    let flipped_tok = tok === 1 ? 0 : 1;
    return 1.0 - getV(oVp, next_oHlt, next_mVp, next_mHlt, flipped_tok);
}

`;

bakerCode = bakerCode.substring(0, simStart) + newSimTurn + bakerCode.substring(simEnd);
fs.writeFileSync('games/king-of-tokyo/scripts/exact_tactics_baker.ts', bakerCode);
