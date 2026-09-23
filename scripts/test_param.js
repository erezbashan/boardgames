require.extensions['.css'] = () => {};
const { kingOfTokyoReducer, initialKotState } = require('./games/king-of-tokyo/dist/engine/reducer');
const { runSimulationBatch } = require('./packages/boardgame-core/dist/engine/simulateGame');
const { createInitialPopulation } = require('./packages/boardgame-core/dist/engine/geneticAlgorithm');

const pop = createInitialPopulation(4);
const pConfigs = pop.map((p, i) => ({ id: `bot_${i}`, botStrategy: JSON.stringify(p.dna) }));

runSimulationBatch(kingOfTokyoReducer, initialKotState, pConfigs, 1, (res) => {
  console.log("Game totalTurns:", res[0].totalTurns);
});
