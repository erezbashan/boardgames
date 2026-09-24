import { createInitialGameState, addPlayer, startGame, calculateNetWorth } from '../src/engine/engine';
import { acquireReducer } from '../src/engine/reducer';
import { HeuristicBot } from '../src/engine/bots/HeuristicBot';
import { Bot } from '../src/engine/bots/Bot';

const GAMES = 500;
function runSimulation(name1: string, bot1: Bot, name2: string, bot2: Bot) {
  let wins1 = 0; let wins2 = 0;
  for (let i = 0; i < GAMES; i++) {
    let state = createInitialGameState(`game${i}`);
    const bots: Bot[] = [bot1, bot2, bot1, bot2];
    for (let j = bots.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [bots[j], bots[k]] = [bots[k], bots[j]];
    }
    bots.forEach((bot, idx) => {
      state = addPlayer(state, { id: `p${idx}`, name: bot === bot1 ? `${name1}_${idx}` : `${name2}_${idx}`, isBot: true, money: 6000, stocks: { Tower: 0, Luxor: 0, American: 0, Worldwide: 0, Festival: 0, Imperial: 0, Continental: 0 }, tiles: [], stats: { chainsFounded: 0, mergesCaused: 0, firstBonuses: 0, secondBonuses: 0, sharesBought: 0 } });
    });
    state = startGame(state);
    let turns = 0;
    while (state.phase !== 'GameOver' && turns < 5000) {
      const activePlayerId = state.phase === 'MergeResolution' && state.pendingMerge ? state.playerOrder[state.pendingMerge.playerResolutionIndex] : state.phase === 'ChooseMergeSurvivor' && state.pendingSurvivorChoice ? state.pendingSurvivorChoice.playerId : state.phase === 'FoundCorporation' && state.pendingFounding ? state.pendingFounding.playerId : state.playerOrder[state.currentPlayerIndex];
      if (!activePlayerId) break;
      const botIndex = parseInt(activePlayerId.replace('p', ''));
      const bot = bots[botIndex];
      const action = bot.takeTurn(state, activePlayerId);
      if (!action) break;
      try { state = acquireReducer(state, action); } catch (e) { break; }
      turns++;
    }
    let maxWorth = -1; let winnerId = '';
    state.playerOrder.forEach(pId => { const worth = calculateNetWorth(state, pId); if (worth > maxWorth) { maxWorth = worth; winnerId = pId; }});
    const winnerBot = bots[parseInt(winnerId.replace('p', ''))];
    if (winnerBot === bot1) wins1++;
    if (winnerBot === bot2) wins2++;
  }
  return { wins1, wins2 };
}

const baseBot = new HeuristicBot(); // defaults to hoardingPenalty: 200, insiderTradingBonus: 200

console.log("Testing Hoarding & Insider Trading thresholds...");
const tests = [
  { val: 0, name: "Hoard Penalty: 0" },
  { val: 100, name: "Hoard Penalty: 100" },
  { val: 400, name: "Hoard Penalty: 400" },
  { val: 600, name: "Hoard Penalty: 600" }
];
for (const tc of tests) {
    const testBot = new HeuristicBot({ thresholds: { hoardingPenalty: tc.val }});
    const { wins1, wins2 } = runSimulation('Base(200)', baseBot, tc.name, testBot);
    console.log(`[${tc.name}] Base: ${wins1}, Feature: ${wins2} (${((wins2/(wins1+wins2))*100).toFixed(1)}%)`);
}

const tests2 = [
  { val: 0, name: "Insider Bonus: 0" },
  { val: 100, name: "Insider Bonus: 100" },
  { val: 400, name: "Insider Bonus: 400" }
];
for (const tc of tests2) {
    const testBot = new HeuristicBot({ thresholds: { insiderTradingBonus: tc.val }});
    const { wins1, wins2 } = runSimulation('Base(200)', baseBot, tc.name, testBot);
    console.log(`[${tc.name}] Base: ${wins1}, Feature: ${wins2} (${((wins2/(wins1+wins2))*100).toFixed(1)}%)`);
}
