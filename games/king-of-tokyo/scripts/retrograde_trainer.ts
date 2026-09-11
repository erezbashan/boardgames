require.extensions['.css'] = () => {};
import { KotState } from '../src/engine/types';
import { kingOfTokyoReducer as reducer } from '../src/engine/reducer';
import * as fs from 'fs';
import * as path from 'path';

const NUM_SIMS = 50000;
const VP_BUCKETS = [[0, 9], [10, 15], [16, 19]];
const HEALTH_BUCKETS = [[1, 4], [5, 7], [8, 10]];

const DICE_COMBOS: any[] = [];
for (const vps of [true, false]) {
    for (const att of [true, false]) {
        for (const hlt of [true, false]) {
            for (const enr of [true, false]) {
                DICE_COMBOS.push({ VPS: vps, ATT: att, HLT: hlt, ENR: enr });
            }
        }
    }
}

const YIELD_COMBOS = [{ YLD: true }, { YLD: false }];

function createBucketState(numPlayers: number, myVp: number, myHealth: number, otherVp: number, otherHealth: number, inTokyo: boolean): KotState {
    const initialState = reducer(undefined as any, { type: 'INIT_GAME', payload: { settings: { maxHealth: 10, maxVp: 20 } } });
    let state = initialState;
    for (let i = 1; i <= numPlayers; i++) {
        state = reducer(state, { type: 'JOIN_GAME', payload: { playerId: `P${i}`, name: `P${i}`, isBot: true, botStrategy: 'bucket' } });
    }
    state = reducer(state, { type: 'START_GAME', payload: {} });

    state.players['P1'].vp = myVp;
    state.players['P1'].health = myHealth;
    state.players['P1'].location = inTokyo ? 'TokyoCity' : 'Outside';

    state.players['P2'].vp = otherVp;
    state.players['P2'].health = otherHealth;
    state.players['P2'].location = inTokyo ? 'Outside' : 'TokyoCity';
    
    for (let i = 3; i <= numPlayers; i++) {
        state.players[`P${i}`].vp = 0;
        state.players[`P${i}`].health = 10;
        state.players[`P${i}`].location = 'Outside';
    }

    state.currentPlayerIndex = state.playerOrder.indexOf('P1');
    return state;
}

function simulateGame(initialState: KotState): boolean {
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
    return state.winnerId === 'P1';
}

async function train() {
    const CONFIG_PATH = path.join(__dirname, '../src/bots/bucketConfig.ts');
    let diceConfig: any = {};
    let yieldConfig: any = {};
    
    if (fs.existsSync(CONFIG_PATH)) {
        const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
        const matchDice = raw.match(/export const diceConfig[\s\S]*?=\s*({[\s\S]*?});/);
        if (matchDice) diceConfig = JSON.parse(matchDice[1]);
        const matchYield = raw.match(/export const yieldConfig[\s\S]*?=\s*({[\s\S]*?});/);
        if (matchYield) yieldConfig = JSON.parse(matchYield[1]);
    }
    
    (global as any).__DICE_CONFIG_OVERRIDE = diceConfig;
    (global as any).__YIELD_CONFIG_OVERRIDE = yieldConfig;

    for (let numPlayers = 2; numPlayers <= 6; numPlayers++) {
        console.log(`\n========================================`);
        console.log(`🚀 STARTING STAGE: ${numPlayers}-PLAYER GAME`);
        console.log(`========================================\n`);
        
        for (const myVp of VP_BUCKETS) {
            for (const otherVp of VP_BUCKETS) {
                for (const myHealth of HEALTH_BUCKETS) {
                    for (const otherHealth of HEALTH_BUCKETS) {
                        for (const inTokyo of [true, false]) {
                            
                            const vpKey = myVp[1] === 9 ? '0-9' : myVp[1] === 15 ? '10-15' : '16-19';
                            const ovpKey = otherVp[1] === 9 ? '0-9' : otherVp[1] === 15 ? '10-15' : '16-19';
                            const hlKey = myHealth[1] === 4 ? '1-4' : myHealth[1] === 7 ? '5-7' : '8+';
                            const ohlKey = otherHealth[1] === 4 ? '1-4' : otherHealth[1] === 7 ? '5-7' : '8+';
                            
                            const baseKey = `VP:${vpKey}|OVP:${ovpKey}|HLT:${hlKey}|OHLT:${ohlKey}|TOK:${inTokyo}`;
                            const dBucketKey = numPlayers === 2 ? baseKey : `P:${numPlayers}|${baseKey}`;
                            
                            if (!diceConfig[dBucketKey]) {
                                console.log(`Solving DICE bucket: ${dBucketKey}`);
                                let stats = DICE_COMBOS.map(strat => ({ strat, wins: 0, sims: 0 }));
                                const CHUNK_SIZE = 2000;
                                const MAX_CHUNKS = 50; // max 50k sims
                                let finalResults = [];
                                
                                for (let chunk = 1; chunk <= MAX_CHUNKS; chunk++) {
                                    for (let s of stats) {
                                        diceConfig[dBucketKey] = s.strat;
                                        for (let i = 0; i < CHUNK_SIZE; i++) {
                                            const rMyVp = Math.floor(Math.random() * (myVp[1] - myVp[0] + 1)) + myVp[0];
                                            const rOtherVp = Math.floor(Math.random() * (otherVp[1] - otherVp[0] + 1)) + otherVp[0];
                                            const rMyHealth = Math.floor(Math.random() * (myHealth[1] - myHealth[0] + 1)) + myHealth[0];
                                            const rOtherHealth = Math.floor(Math.random() * (otherHealth[1] - otherHealth[0] + 1)) + otherHealth[0];
                                            const state = createBucketState(numPlayers, rMyVp, rMyHealth, rOtherVp, rOtherHealth, inTokyo);
                                            if (simulateGame(state)) s.wins++;
                                            s.sims++;
                                        }
                                    }
                                    
                                    stats.sort((a, b) => (b.wins / b.sims) - (a.wins / a.sims));
                                    const best = stats[0];
                                    const median = stats[7];
                                    const bestWR = best.wins / best.sims;
                                    const medianWR = median.wins / median.sims;
                                    const MOE = 1.96 * Math.sqrt(0.25 / best.sims);
                                    
                                    if (bestWR - medianWR > MOE || chunk === MAX_CHUNKS) {
                                        finalResults = stats.map(s => ({ strat: s.strat, winRate: s.wins / s.sims }));
                                        diceConfig[dBucketKey] = best.strat;
                                        
                                        console.log(`  -> [Dice] Stopped at ${best.sims} sims. Best: ${JSON.stringify(best.strat)} (WR: ${(bestWR * 100).toFixed(2)}%)`);
                                        console.log(`  -> Runner Up 1: ${JSON.stringify(stats[1].strat)} (WR: ${((stats[1].wins / stats[1].sims) * 100).toFixed(2)}%)`);
                                        console.log(`  -> Median (8th): ${JSON.stringify(median.strat)} (WR: ${(medianWR * 100).toFixed(2)}%)`);
                                        break;
                                    }
                                }
                                
                                fs.writeFileSync(CONFIG_PATH, `export const diceConfig: Record<string, any> = ${JSON.stringify(diceConfig, null, 2)};\nexport const yieldConfig: Record<string, any> = ${JSON.stringify(yieldConfig, null, 2)};\n`);
                            }
                            
                            if (inTokyo) {
                                for (let turnsToMe = 1; turnsToMe < numPlayers; turnsToMe++) {
                                    const yBaseKey = `VP:${vpKey}|OVP:${ovpKey}|HLT:${hlKey}|OHLT:${ohlKey}|TurnsToMe:${turnsToMe}`;
                                    const yBucketKey = numPlayers === 2 ? yBaseKey : `P:${numPlayers}|${yBaseKey}`;
                                    
                                    if (!yieldConfig[yBucketKey]) {
                                        console.log(`Solving YIELD bucket: ${yBucketKey}`);
                                        let yStats = YIELD_COMBOS.map(strat => ({ strat, wins: 0, sims: 0 }));
                                        const Y_CHUNK_SIZE = 2000;
                                        const Y_MAX_CHUNKS = 50;
                                        
                                        for (let chunk = 1; chunk <= Y_MAX_CHUNKS; chunk++) {
                                            for (let s of yStats) {
                                                yieldConfig[yBucketKey] = s.strat;
                                                for (let i = 0; i < Y_CHUNK_SIZE; i++) {
                                                    const rMyVp = Math.floor(Math.random() * (myVp[1] - myVp[0] + 1)) + myVp[0];
                                                    const rOtherVp = Math.floor(Math.random() * (otherVp[1] - otherVp[0] + 1)) + otherVp[0];
                                                    const rMyHealth = Math.floor(Math.random() * (myHealth[1] - myHealth[0] + 1)) + myHealth[0];
                                                    const rOtherHealth = Math.floor(Math.random() * (otherHealth[1] - otherHealth[0] + 1)) + otherHealth[0];
                                                    const state = createBucketState(numPlayers, rMyVp, rMyHealth, rOtherVp, rOtherHealth, true);
                                                    if (simulateGame(state)) s.wins++;
                                                    s.sims++;
                                                }
                                            }
                                            
                                            yStats.sort((a, b) => (b.wins / b.sims) - (a.wins / a.sims));
                                            const best = yStats[0];
                                            const runnerUp = yStats[1];
                                            const bestWR = best.wins / best.sims;
                                            const runnerUpWR = runnerUp.wins / runnerUp.sims;
                                            const MOE = 1.96 * Math.sqrt(0.25 / best.sims);
                                            
                                            if (bestWR - runnerUpWR > MOE || chunk === Y_MAX_CHUNKS) {
                                                yieldConfig[yBucketKey] = best.strat;
                                                console.log(`  -> [Yield] Stopped at ${best.sims} sims. Best: ${JSON.stringify(best.strat)} (WR: ${(bestWR * 100).toFixed(2)}%)`);
                                                console.log(`  -> Runner Up 1: ${JSON.stringify(runnerUp.strat)} (WR: ${(runnerUpWR * 100).toFixed(2)}%)`);
                                                break;
                                            }
                                        }
                                        
                                        fs.writeFileSync(CONFIG_PATH, `export const diceConfig: Record<string, any> = ${JSON.stringify(diceConfig, null, 2)};\nexport const yieldConfig: Record<string, any> = ${JSON.stringify(yieldConfig, null, 2)};\n`);
                                    }
                                }
                            }
                            
                        }
                    }
                }
            }
        }
    }
}

train().catch(console.error);
