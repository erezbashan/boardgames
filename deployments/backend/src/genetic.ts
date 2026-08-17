import { onCall } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { flipsReducer, initialFlipsState } from "@erez/flips/dist/engine/reducer";
import { kingOfTokyoReducer, initialKotState } from "@erez/king-of-tokyo/dist/engine/reducer";
import { createInitialPopulation, evolvePopulation, getStrategyString } from "@erez/boardgame-core/dist/engine/geneticAlgorithm";
import { runSimulationBatch as coreRunSimulationBatch } from "@erez/boardgame-core/dist/engine/simulateGame";

export const startGeneticEvolution = onCall(async (request) => {
  const db = getFirestore();
  const { popSize, numGenerations, gamesPerGen, gameType } = request.data;
  
  const pop = createInitialPopulation(popSize || 750);
  
  const simRef = db.collection('genetic_simulations').doc();
  await simRef.set({
    status: 'running',
    gameType: gameType || 'king-of-tokyo',
    config: {
      popSize: popSize || 750,
      numGenerations: numGenerations || 10,
      gamesPerGen: gamesPerGen || 20000
    },
    currentGeneration: 1,
    gamesCompleted: 0,
    population: JSON.stringify(pop),
    history: [],
    createdAt: FieldValue.serverTimestamp()
  });

  return { simId: simRef.id };
});

export const onGeneticSimulationUpdated = onDocumentWritten({
  document: "genetic_simulations/{simId}",
  timeoutSeconds: 540
}, async (event) => {
  const db = getFirestore();
  const data = event.data?.after.data();
  const prevData = event.data?.before?.data();
  if (!data) return;

  if (data.status !== 'running') return;
  if (data.method === 'q-learning') return; // Ignore Q-learning docs

  const { currentGeneration, config, gameType } = data;
  const gamesPerGen = config.gamesPerGen;

  // Cap chunk size to keep execution under 30 seconds
  const CHUNK_SIZE = Math.max(10, Math.min(1000, Math.floor(gamesPerGen / 10)));
  
  if (data.gamesCompleted >= gamesPerGen) {
    if (prevData && prevData.gamesCompleted >= gamesPerGen) {
      return;
    }
    
    // EVOLVE!
    const pop = JSON.parse(data.population);
    const sortedPop = [...pop].sort((a: any, b: any) => (b.wins / Math.max(1, b.gamesPlayed)) - (a.wins / Math.max(1, a.gamesPlayed)));
    const best = sortedPop[0];
    const newPop = evolvePopulation(pop, currentGeneration);

    const top20Count = Math.max(1, Math.floor(sortedPop.length * 0.2));
    const top20 = sortedPop.slice(0, top20Count);
    
    const dnaLen = best.dna.length;
    
    const avgDna = Array.from({ length: dnaLen }, () => ({ a: 0, h: 0, e: 0, p: 0, s: 0, total: 0 }));
    top20.forEach(bot => {
      for (let i = 0; i < dnaLen; i++) {
        const mask = bot.dna[i];
        let activeTraits = 0;
        if ((mask & 1) > 0) activeTraits++;
        if ((mask & 2) > 0) activeTraits++;
        if ((mask & 4) > 0) activeTraits++;
        if ((mask & 8) > 0) activeTraits++;
        if ((mask & 16) > 0) activeTraits++;
        
        if (activeTraits > 0) {
          const weight = 1 / activeTraits;
          if ((mask & 1) > 0) avgDna[i].a += weight;
          if ((mask & 2) > 0) avgDna[i].h += weight;
          if ((mask & 4) > 0) avgDna[i].e += weight;
          if ((mask & 8) > 0) avgDna[i].p += weight;
          if ((mask & 16) > 0) avgDna[i].s += weight;
        }
        avgDna[i].total++;
      }
    });

    const newHistory = [...(data.history || []), {
      generation: currentGeneration,
      bestDna: best.dna,
      avgDna: avgDna,
      wins: best.wins,
      gamesPlayed: best.gamesPlayed
    }];

    return db.collection('genetic_simulations').doc(event.params.simId).update({
      currentGeneration: currentGeneration + 1,
      gamesCompleted: 0,
      population: JSON.stringify(newPop),
      history: newHistory,
      updatedAt: FieldValue.serverTimestamp()
    });
  }

  // Ensure we don't trigger recursively from other field updates
  if (prevData && prevData.gamesCompleted === data.gamesCompleted && prevData.currentGeneration === data.currentGeneration) {
    return;
  }

  console.log(`Simulating Genetic Chunk for ${event.params.simId} Gen ${currentGeneration}: ${data.gamesCompleted} / ${gamesPerGen}`);

  let pop = JSON.parse(data.population);
  let reducer: any;
  let initialState: any;
  if (gameType === 'flips') {
    reducer = flipsReducer;
    initialState = initialFlipsState;
  } else {
    reducer = kingOfTokyoReducer;
    initialState = initialKotState;
  }

  const chunk = Math.min(CHUNK_SIZE, gamesPerGen - data.gamesCompleted);
  for (let i = 0; i < chunk; i++) {
    const gamePlayersCount = Math.floor(Math.random() * 5) + 2;
    const pConfigs: any[] = [];
    const selectedBots: any[] = [];
    
    const availableBots = [...pop].sort((a: any, b: any) => {
       if (a.gamesPlayed !== b.gamesPlayed) return a.gamesPlayed - b.gamesPlayed;
       return Math.random() - 0.5;
    });
    
    for (let p = 0; p < gamePlayersCount; p++) {
      const bot = availableBots[p];
      selectedBots.push(bot);
      pConfigs.push({ id: bot.id, botStrategy: getStrategyString(bot.dna) });
    }
    
    coreRunSimulationBatch(reducer, initialState, pConfigs, 1, (res: any) => {
      selectedBots.forEach(b => b.gamesPlayed++);
      if (res[0].winnerId) {
        const winnerBot = selectedBots.find(b => b.id === res[0].winnerId);
        if (winnerBot) winnerBot.wins++;
      }
    });
  }

  return db.collection('genetic_simulations').doc(event.params.simId).update({
    gamesCompleted: data.gamesCompleted + chunk,
    population: JSON.stringify(pop),
    updatedAt: FieldValue.serverTimestamp()
  });
});
