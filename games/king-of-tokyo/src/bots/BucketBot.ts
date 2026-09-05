import type { KotAction, KotState } from '../engine/types';
import { getBotAction as getRandomBotAction } from './randomBot';
import { CARD_REGISTRY } from '../engine/cards/registry';
import { bucketConfig } from './bucketConfig';

function getMyVPsBucket(vps: number): string {
    if (vps <= 9) return '0-9';
    if (vps <= 15) return '10-15';
    return '16-19';
}

function getOtherVPsBucket(vps: number): string {
    if (vps <= 9) return '0-9';
    if (vps <= 15) return '10-15';
    return '16-19';
}

function getMyHealthBucket(health: number): string {
    if (health <= 4) return '1-4';
    if (health <= 7) return '5-7';
    return '8+';
}

function getOtherHealthBucket(health: number): string {
    if (health <= 4) return '1-4';
    if (health <= 7) return '5-7';
    return '8+';
}

export function getStateBucketKey(state: KotState, playerId: string): string {
    const player = state.players[playerId];
    
    let otherMaxVPs = 0;
    let otherMinHealth = 10;
    
    for (const pId of Object.keys(state.players)) {
        if (pId !== playerId && state.players[pId].health > 0) {
            const p = state.players[pId];
            if (p.vp > otherMaxVPs) otherMaxVPs = p.vp;
            if (p.health < otherMinHealth) otherMinHealth = p.health;
        }
    }
    
    const vpBucket = getMyVPsBucket(player.vp);
    const ovpBucket = getOtherVPsBucket(otherMaxVPs);
    const hlBucket = getMyHealthBucket(player.health);
    const ohlBucket = getOtherHealthBucket(otherMinHealth);
    const inTokyo = player.location.startsWith('Tokyo');
    
    const playersLeft = Object.values(state.players).filter(p => p.health > 0).length;
    const baseKey = `VP:${vpBucket}|OVP:${ovpBucket}|HLT:${hlBucket}|OHLT:${ohlBucket}|TOK:${inTokyo}`;
    
    return playersLeft === 2 ? baseKey : `P:${playersLeft}|${baseKey}`;
}

export function getBucketBotAction(state: KotState, playerId: string): KotAction | null {
    const player = state.players[playerId];
    if (!player) return null;

    const topAction = state.pendingActions[0];
    const bucketKey = getStateBucketKey(state, playerId);
    
    // Default strategy if not found in config
    let config = bucketConfig;
    if (typeof (global as any).__BUCKET_CONFIG_OVERRIDE !== 'undefined') {
        config = (global as any).__BUCKET_CONFIG_OVERRIDE;
    }
    const strategy = config[bucketKey] || { VPS: true, ATT: true, HLT: player.health < 8, ENR: true, YLD: player.health <= 4 };

    const inTokyo = player.location.startsWith('Tokyo');

    if (topAction?.type === 'ASK_ROLL' && topAction.payload?.prompt?.playerId === playerId) {
        const keptIds: string[] = [];
        let unlockedCount = state.dice.length;
        const rerollsLeft = (state.maxRolls || 3) - (state.rollCount || 0);

        let keptHearts = 0;
        let keptSmashes = 0;
        
        const tokyoOccupied = Object.values(state.players).some(p => p.health > 0 && p.location.startsWith('Tokyo'));

        state.dice.forEach(d => {
            let keep = false;
            if (d.value === 'Smash' && strategy.ATT) {
                if (tokyoOccupied || keptSmashes < 1) {
                    keep = true;
                    keptSmashes++;
                }
            } else if (d.value === 'Heart' && strategy.HLT && !inTokyo) {
                if (player.health + keptHearts < (state.settings?.maxHealth || 10) - 1) {
                    keep = true;
                    keptHearts++;
                }
            } else if (d.value === 'Energy' && strategy.ENR) {
                keep = true;
            }

            if (keep) {
                keptIds.push(d.id);
                unlockedCount--;
            }
        });

        // Keep points if playing points
        if (strategy.VPS) {
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

        const stratNames = Object.keys(strategy).filter(k => strategy[k]).join(', ');
        const stratLog = stratNames ? `[${stratNames}]` : '[Random]';
        return { type: 'RESPONSE_ROLL', payload: { roll: true, keptDiceIds: keptIds, strategyLog: stratLog } as any };
    }

    if (topAction?.type === 'ASK' && topAction.payload?.prompt?.playerId === playerId) {
        if (topAction.payload.prompt.text && topAction.payload.prompt.text.includes('yield Tokyo')) {
            const options = topAction.payload.prompt.options as any[];
            if (!strategy.YLD && options.some(o => o.label === 'Stay')) {
                return options.find(o => o.label === 'Stay').action;
            } else if (strategy.YLD && options.some(o => o.label === 'Yield')) {
                return options.find(o => o.label === 'Yield').action;
            }
        }
    }

    if (topAction?.type === 'ASK_MARKET' && topAction.payload?.prompt?.playerId === playerId) {
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

        // Sort descending by cost
        affordableCards.sort((a, b) => {
            const costA = CARD_REGISTRY[a.cardId]?.cost || 0;
            const costB = CARD_REGISTRY[b.cardId]?.cost || 0;
            return costB - costA;
        });

        for (const card of affordableCards) {
            const cost = CARD_REGISTRY[card.cardId]?.cost || 0;
            const chance = (cost - 2) / 8;
            if (Math.random() <= chance) {
                return { type: 'RESPONSE_MARKET', payload: { action: 'BUY', cardId: card.cardId, marketIndex: card.index } };
            }
        }
        
        return { type: 'RESPONSE_MARKET', payload: { action: 'DONE' } };
    }

    return getRandomBotAction(state, playerId);
}
