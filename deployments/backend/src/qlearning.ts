import { onCall } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { flipsReducer, initialFlipsState } from "@erez/flips/dist/engine/reducer";
import { kingOfTokyoReducer, initialKotState } from "@erez/king-of-tokyo/dist/engine/reducer";
import { createInitialQTable, qTableToBestDna, GlobalQTableCache } from "@erez/boardgame-core/dist/engine/qLearningAlgorithm";
import { runSimulationBatch as coreRunSimulationBatch } from "@erez/boardgame-core/dist/engine/simulateGame";

export const startQLearningEvolution = onCall(async (request) => {
  const db = getFirestore();
  const { gamesPerGen, gameType } = request.data;
  
  const qTable = createInitialQTable();
  
  const simRef = db.collection('genetic_simulations').doc(); // Reuse collection for dashboard
  await simRef.set({
    method: 'q-learning',
    status: 'running',
    gameType: gameType || 'king-of-tokyo',
    config: {
      popSize: 4, 
      numGenerations: 50, 
      gamesPerGen: gamesPerGen || 10000
    },
    currentGeneration: 1,
    gamesCompleted: 0,
    population: JSON.stringify(qTable),
    epsilon: 1.0,
    history: [],
    createdAt: FieldValue.serverTimestamp()
  });

  return { simId: simRef.id };
});

export const onQLearningSimulationUpdated = onDocumentWritten({
  document: "genetic_simulations/{simId}",
  timeoutSeconds: 540
}, async (event) => {
  const db = getFirestore();
  const data = event.data?.after.data();
  const prevData = event.data?.before?.data();
  if (!data || data.method !== 'q-learning' || data.status !== 'running') return;

  const { currentGeneration, config, gameType } = data;
  const gamesPerGen = config.gamesPerGen;
  const CHUNK_SIZE = Math.max(10, Math.min(1000, Math.floor(gamesPerGen / 10)));
  
  if (data.gamesCompleted >= gamesPerGen) {
    if (prevData && prevData.gamesCompleted >= gamesPerGen) return;
    
    // EVOLVE! (In Q-learning this means saving the generation state and decaying epsilon)
    const qTable = JSON.parse(data.population);
    const bestDna = qTableToBestDna(qTable);
    
    // Create dummy avgDna for UI
    const avgDna = Array.from({ length: 54 }, (_, idx) => {
      const row = qTable[idx];
      const maxQ = Math.max(...row);
      const res = { a: 0, h: 0, e: 0, p: 0, s: 0, total: 1 };
      const bestA = row.indexOf(maxQ) + 1;
      if ((bestA & 1) > 0) res.a = 1;
      if ((bestA & 2) > 0) res.h = 1;
      if ((bestA & 4) > 0) res.e = 1;
      if ((bestA & 8) > 0) res.p = 1;
      if ((bestA & 16) > 0) res.s = 1;
      return res;
    });

    const newHistory = [...(data.history || []), {
      generation: currentGeneration,
      bestDna: bestDna,
      avgDna: avgDna,
      wins: 0,
      gamesPlayed: gamesPerGen
    }];

    // Decay epsilon
    let newEpsilon = data.epsilon * 0.9;
    if (newEpsilon < 0.05) newEpsilon = 0.05;

    return db.collection('genetic_simulations').doc(event.params.simId).update({
      currentGeneration: currentGeneration + 1,
      gamesCompleted: 0,
      epsilon: newEpsilon,
      history: newHistory,
      updatedAt: FieldValue.serverTimestamp()
    });
  }

  if (prevData && prevData.gamesCompleted === data.gamesCompleted && prevData.currentGeneration === data.currentGeneration && prevData.status === data.status) {
    return;
  }

  console.log(`Simulating Q-Learning Chunk Gen ${currentGeneration}: ${data.gamesCompleted} / ${gamesPerGen}`);

  let qTable = JSON.parse(data.population);
  const alpha = 0.05; 
  const epsilon = data.epsilon || 0.05;
  const simId = event.params.simId;

  // CRITICAL FIX: Put the Q-table in global memory to avoid JSON parsing in bot actions!
  GlobalQTableCache.set(simId, { qTable, epsilon });

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
    
    for (let p = 0; p < gamePlayersCount; p++) {
      // Just pass the simId, qBot will look up in memory!
      pConfigs.push({ id: `bot_${p}`, botStrategy: `qlearn:${simId}` });
    }

    coreRunSimulationBatch(reducer, initialState, pConfigs, 1, (res: any) => {
      const result = res[0];
      const finalState = result.finalState;
      if (!finalState || !finalState.players) return;

      Object.keys(finalState.players).forEach(playerId => {
        const player = finalState.players[playerId];
        const history = player.qLearningHistory;
        if (!history || history.length === 0) return;

        const reward = (result.winnerId === playerId) ? 1.0 : -1.0;

        history.forEach((step: {stateIdx: number, actionMask: number}) => {
          const s = step.stateIdx;
          const a = step.actionMask - 1; 
          if (qTable[s] && typeof qTable[s][a] === 'number') {
            qTable[s][a] = qTable[s][a] + alpha * (reward - qTable[s][a]);
          }
        });
      });
    });
  }

  // Clear memory to prevent leaks
  GlobalQTableCache.delete(simId);

  return db.collection('genetic_simulations').doc(event.params.simId).update({
    gamesCompleted: data.gamesCompleted + chunk,
    population: JSON.stringify(qTable),
    updatedAt: FieldValue.serverTimestamp()
  });
});
