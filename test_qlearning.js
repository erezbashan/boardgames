require.extensions['.css'] = () => {};
const { kingOfTokyoReducer, initialKotState } = require('./games/king-of-tokyo/dist/engine/reducer');
const { runSimulationBatch } = require('./packages/boardgame-core/dist/engine/simulateGame');
const { createInitialQTable, GlobalQTableCache } = require('./packages/boardgame-core/dist/engine/qLearningAlgorithm');

const qTable = createInitialQTable();
const simId = 'test_sim';
GlobalQTableCache.set(simId, { qTable, epsilon: 1.0 });

const pConfigs = [
  { id: 'bot_0', botStrategy: `qlearn:${simId}` },
  { id: 'bot_1', botStrategy: `qlearn:${simId}` },
  { id: 'bot_2', botStrategy: `qlearn:${simId}` },
  { id: 'bot_3', botStrategy: `qlearn:${simId}` }
];

runSimulationBatch(kingOfTokyoReducer, initialKotState, pConfigs, 1, (res) => {
  console.log("Game totalTurns:", res[0].totalTurns);
  console.log("Player qHistory length:", res[0].finalState.players['bot_0'].qLearningHistory?.length);
});
