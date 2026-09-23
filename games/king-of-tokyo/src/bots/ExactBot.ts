import { getActionFromRandomBot as getRandomBotAction } from './randomBot';
import { CARD_REGISTRY } from '../engine/cards/registry';
import { KotState } from '../engine/types';
import { getBotAction as getBucketBotAction } from './registry';
import optimizedTactics from './stat_optimized_tactics.json';
import trueValues from './post_turn_values.json';

function getStateKey(vp: number, hlt: number, tok: number, oppVp: number, oppHlt: number) {
    const vpCapped = Math.min(20, Math.max(0, vp));
    const hltCapped = Math.min(10, Math.max(1, hlt));
    const oppVpCapped = Math.min(20, Math.max(0, oppVp));
    const oppHltCapped = Math.min(10, Math.max(1, oppHlt));
    return `${vpCapped}_${hltCapped}_${tok}_${oppVpCapped}_${oppHltCapped}`;
}

export function getExactBotAction(state: KotState, playerId: string): any {
    const player = state.players[playerId];
    if (!player || player.health <= 0) return null;

    if (!state.pendingActions || state.pendingActions.length === 0) return null;
    const topAction = state.pendingActions[0];

    const numPlayersAlive = state.playerOrder.filter(id => state.players[id] && state.players[id].health > 0).length;
    const playerStr = Math.max(2, Math.min(6, numPlayersAlive)).toString();
    
    let oppVp = 0;
    let oppHlt = 0;
    for (const pId of state.playerOrder) {
        if (pId !== playerId && state.players[pId] && state.players[pId].health > 0) {
            const opp = state.players[pId];
            if (opp.vp > oppVp) oppVp = opp.vp;
            if (opp.health > oppHlt) oppHlt = opp.health; // Track max health or min health? Let's track max for 2p it's just the other player
        }
    }

    const tok = player.location.startsWith('Tokyo') ? 1 : 0;
    const stateKey = getStateKey(player.vp, player.health, tok, oppVp, oppHlt);
    
    const tacticObj = (optimizedTactics as any)[playerStr]?.[stateKey];
    const tactic = tacticObj ? tacticObj.tactic : null;
    
    // Fallback to bucket bot if we somehow have no tactic
    if (!tactic && (topAction.type === 'ASK_ROLL' || topAction.type === 'ASK_MARKET' || topAction.type === 'ASK')) {
        const oldStrat = player.botStrategy;
        player.botStrategy = 'bucket';
        const fallback = getBucketBotAction(state, playerId);
        player.botStrategy = oldStrat;
        return fallback;
    }

    if (topAction.type === 'ASK_ROLL') {
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
            
            // Apply tactic overrides with standard BucketBot smart logic
            if (tactic.ATT && d.value === 'Smash') {
                if (tokyoOccupied || keptSmashes < 1) {
                    keep = true;
                    keptSmashes++;
                }
            } else if (tactic.HLT && d.value === 'Heart' && !inTokyo) {
                if (player.health + keptHearts < (state.settings?.maxHealth || 10) - 1) {
                    keep = true;
                    keptHearts++;
                }
            } else if (tactic.ENR && d.value === 'Energy') {
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

    if (topAction.type === 'ASK') {
        const text = topAction.payload?.prompt?.text || '';
        if (text.includes('yield Tokyo')) {
            const aliveOrder = state.playerOrder.filter(p => state.players[p].health > 0);
            const myIdx = aliveOrder.indexOf(playerId);
            let activeIdx = aliveOrder.indexOf(state.playerOrder[state.currentPlayerIndex]);
            if (activeIdx === -1) activeIdx = myIdx;
            const turnsToMe = (myIdx - activeIdx + aliveOrder.length) % aliveOrder.length;
            
            // Hardcoded heuristic: don't yield if you're about to win next turn
            if (player.vp >= 18 && turnsToMe === 1) {
                const options = topAction.payload.prompt.options as any[];
                if (options.some(o => o.label === 'Stay')) {
                    return options.find(o => o.label === 'Stay').action;
                }
            }
            
            // Dynamically check win% of yielding vs staying
            const val_yield = (trueValues as any)[playerStr]?.[getStateKey(player.vp, player.health, 0, oppVp, oppHlt)] || 0.5;
            const val_stay = (trueValues as any)[playerStr]?.[getStateKey(player.vp, player.health, 1, oppVp, oppHlt)] || 0.5;
            
            const options = topAction.payload.prompt.options as any[];
            if (val_yield > val_stay && options.some(o => o.label === 'Yield')) {
                return options.find(o => o.label === 'Yield').action;
            } else if (options.some(o => o.label === 'Stay')) {
                return options.find(o => o.label === 'Stay').action;
            }
            return options[0].action;
        }
    }

    if (topAction.type === 'ASK_MARKET') {
        const oldStrat = player.botStrategy;
        player.botStrategy = 'bucket';
        const fallback = getBucketBotAction(state, playerId);
        player.botStrategy = oldStrat;
        return fallback;
    }
    
    return getRandomBotAction(state, playerId);
}
