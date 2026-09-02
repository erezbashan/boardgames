require.extensions['.css'] = () => {};
import { KotState } from '../src/engine/types';
import { kingOfTokyoReducer as reducer } from '../src/engine/reducer';
import * as fs from 'fs';
import * as path from 'path';

function createBucketState(myVp: number, myHealth: number, otherVp: number, otherHealth: number, inTokyo: boolean): KotState {
    const initialState = reducer(undefined as any, { type: 'INIT_GAME', payload: { settings: { maxHealth: 10, maxVp: 20 } } });
    
    let state = reducer(initialState, { type: 'JOIN_GAME', payload: { playerId: 'P1', name: 'P1', isBot: true, botStrategy: 'bucket' } });
    state = reducer(state, { type: 'JOIN_GAME', payload: { playerId: 'P2', name: 'P2', isBot: true, botStrategy: 'bucket' } });
    state = reducer(state, { type: 'START_GAME', payload: {} });

    state.players['P1'].vp = myVp;
    state.players['P1'].health = myHealth;
    state.players['P1'].location = inTokyo ? 'TokyoCity' : 'Outside';

    state.players['P2'].vp = otherVp;
    state.players['P2'].health = otherHealth;
    state.players['P2'].location = inTokyo ? 'Outside' : 'TokyoCity';

    state.currentPlayerIndex = state.playerOrder.indexOf('P1');

    return state;
}

const VP_BUCKETS = [[0, 9], [10, 15], [16, 19]];
const HEALTH_BUCKETS = [[1, 4], [5, 7], [8, 10]];

const STRATEGY_COMBINATIONS: any[] = [];
for (const vps of [true, false]) {
    for (const att of [true, false]) {
        for (const hlt of [true, false]) {
            for (const enr of [true, false]) {
                for (const yld of [true, false]) {
                    STRATEGY_COMBINATIONS.push({ VPS: vps, ATT: att, HLT: hlt, ENR: enr, YLD: yld });
                }
            }
        }
    }
}

async function train() {
    const CONFIG_PATH = path.join(__dirname, '../src/bots/bucketConfig.ts');
    let bucketConfig: any = {};
    if (fs.existsSync(CONFIG_PATH)) {
        const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
        const match = raw.match(/export const bucketConfig.*?=\s*({.*});/s);
        if (match) bucketConfig = JSON.parse(match[1]);
    }

    const vpOrder = [[16, 19], [10, 15], [0, 9]];
    const otherVpOrder = [[16, 19], [10, 15], [0, 9]];

    let bucketsSolved = 0;

    for (const myVp of vpOrder) {
        for (const otherVp of otherVpOrder) {
            for (const myHealth of HEALTH_BUCKETS) {
                for (const otherHealth of HEALTH_BUCKETS) {
                    for (const inTokyo of [true, false]) {
                        
                        const vpKey = myVp[1] === 9 ? '0-9' : myVp[1] === 15 ? '10-15' : '16-19';
                        const ovpKey = otherVp[1] === 9 ? '0-9' : otherVp[1] === 15 ? '10-15' : '16-19';
                        const hlKey = myHealth[1] === 4 ? '1-4' : myHealth[1] === 7 ? '5-7' : '8+';
                        const ohlKey = otherHealth[1] === 4 ? '1-4' : otherHealth[1] === 7 ? '5-7' : '8+';
                        
                        const bucketKey = `VP:${vpKey}|OVP:${ovpKey}|HLT:${hlKey}|OHLT:${ohlKey}|TOK:${inTokyo}`;
                        
                        if (bucketConfig[bucketKey]) {
                            continue;
                        }

                        console.log(`Solving bucket: ${bucketKey}`);

                        let bestStrategy = null;
                        let bestWinRate = -1;

                        for (const strat of STRATEGY_COMBINATIONS) {
                            bucketConfig[bucketKey] = strat;
                            fs.writeFileSync(CONFIG_PATH, `export const bucketConfig: Record<string, any> = ${JSON.stringify(bucketConfig, null, 2)};`);

                            let p1Wins = 0;
                            // small sim count just to test script viability
                            const NUM_SIMS = 100000;
                            
                            for (let i = 0; i < NUM_SIMS; i++) {
                                const rMyVp = Math.floor(Math.random() * (myVp[1] - myVp[0] + 1)) + myVp[0];
                                const rOtherVp = Math.floor(Math.random() * (otherVp[1] - otherVp[0] + 1)) + otherVp[0];
                                const rMyHealth = Math.floor(Math.random() * (myHealth[1] - myHealth[0] + 1)) + myHealth[0];
                                const rOtherHealth = Math.floor(Math.random() * (otherHealth[1] - otherHealth[0] + 1)) + otherHealth[0];

                                const initialState = createBucketState(rMyVp, rMyHealth, rOtherVp, rOtherHealth, inTokyo);
                                
                                let state = { ...initialState };
                                let loop = 0;
                                while (state.status !== 'Finished' && loop < 3000) {
                                    if (state.actionQueue && state.actionQueue.length > 0) {
                                        const action = state.actionQueue[0].action;
                                        state.actionQueue = state.actionQueue.slice(1);
                                        state = reducer(state, { ...action, __isSimulation: true });
                                    } else {
                                        break;
                                    }
                                    loop++;
                                }

                                if (state.winnerId === 'P1') p1Wins++;
                            }

                            const winRate = p1Wins / NUM_SIMS;
                            if (winRate > bestWinRate) {
                                bestWinRate = winRate;
                                bestStrategy = strat;
                            }
                        }

                        console.log(`  -> Best Strategy: ${JSON.stringify(bestStrategy)} (Win Rate: ${(bestWinRate * 100).toFixed(1)}%)`);
                        bucketConfig[bucketKey] = bestStrategy;
                        fs.writeFileSync(CONFIG_PATH, `export const bucketConfig: Record<string, any> = ${JSON.stringify(bucketConfig, null, 2)};`);
                        bucketsSolved++;
                        
                    }
                }
            }
        }
    }
}

train().catch(console.error);
