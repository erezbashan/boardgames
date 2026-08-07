// Mock CSS imports so Node.js doesn't crash on shared UI code
require.extensions['.css'] = () => {};

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentWritten, onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { flipsReducer, initialFlipsState, FlipsAction } from "@erez/flips/dist/engine/reducer";
import { kingOfTokyoReducer, initialKotState } from "@erez/king-of-tokyo/dist/engine/reducer";
import { createInitialPopulation, evolvePopulation, getStrategyString } from "@erez/boardgame-core/dist/engine/geneticAlgorithm";
import { runSimulationBatch as coreRunSimulationBatch } from "@erez/boardgame-core/dist/engine/simulateGame";

admin.initializeApp();
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

export const createGame = onCall(async (request) => {
  const { gameType, requestedId } = request.data;
  if (!gameType) throw new HttpsError('invalid-argument', 'gameType is required');

  const gameRef = requestedId ? db.collection('games').doc(requestedId) : db.collection('games').doc();
  const gameId = gameRef.id;

  const doc = await gameRef.get();
  if (doc.exists) return { gameId };

  let state;
  if (gameType === 'flips') {
    state = initialFlipsState;
  } else if (gameType === 'king-of-tokyo') {
    state = initialKotState;
  } else {
    throw new HttpsError('invalid-argument', 'Unsupported game type');
  }

  await gameRef.set({
    gameType,
    state,
    createdAt: FieldValue.serverTimestamp()
  });

  return { gameId };
});

export const dispatchAction = onCall(async (request) => {
  const { gameId, action, gameType } = request.data as { gameId: string, action: FlipsAction, gameType: string };
  if (!gameId || !action || !gameType) {
    throw new HttpsError('invalid-argument', 'gameId, gameType, and action are required');
  }

  const gameRef = db.collection('games').doc(gameId);

  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(gameRef);
    if (!doc.exists) {
      throw new HttpsError('not-found', 'Game not found');
    }

    const gameDoc = doc.data()!;
    let newState;

    const uid = request.auth?.uid;
    const actionWithPlayer = uid ? { ...action, playerId: uid } : action;

    if (gameType === 'flips') {
      if (!gameDoc.state) gameDoc.state = initialFlipsState;
      newState = flipsReducer(gameDoc.state, actionWithPlayer);
    } else if (gameType === 'king-of-tokyo') {
      if (!gameDoc.state) gameDoc.state = initialKotState;
      // Pass gameId into the action so the reducer can log it
      const actionWithGameId = { ...actionWithPlayer, gameId };
      newState = kingOfTokyoReducer(gameDoc.state, actionWithGameId as any);
    } else {
      throw new HttpsError('invalid-argument', 'Unsupported game type');
    }

    transaction.update(gameRef, { state: newState });
  });

  return { success: true };
});

export const onGameUpdated = onDocumentUpdated("games/{gameId}", async (event) => {
  const data = event.data?.after.data();
  if (!data) return;
  const state = data.state;
  if (!state || !state.actionQueue || state.actionQueue.length === 0) return;

  const scheduledAction = state.actionQueue[0];

  // Wait the requested amount of time
  if (scheduledAction.delayMs > 0) {
    await new Promise(r => setTimeout(r, scheduledAction.delayMs));
  }

  const gameId = event.params.gameId;
  const gameRef = db.collection('games').doc(gameId);
  return db.runTransaction(async (transaction) => {
    const gameDoc = await transaction.get(gameRef);
    if (!gameDoc.exists) return;

    const data = gameDoc.data();
    if (!data) return;

    const curState = data.state;
    if (!curState) return;
    
    // Safety check: Ensure the queue hasn't changed/emptied while sleeping
    if (!curState.actionQueue || curState.actionQueue.length === 0) return;

    // Pop the action
    const actionToRun = curState.actionQueue[0].action;
    curState.actionQueue = curState.actionQueue.slice(1);

    let newState;
    if (data.gameType === 'flips') {
      newState = flipsReducer(curState, actionToRun);
    } else if (data.gameType === 'king-of-tokyo') {
      const actionWithGameId = { ...actionToRun, gameId };
      newState = kingOfTokyoReducer(curState, actionWithGameId);
    } else {
      return; // Add other game reducers here later
    }

    transaction.update(gameRef, { state: newState });
  });
});

export const startGeneticEvolution = onCall(async (request) => {
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
  const data = event.data?.after.data();
  const prevData = event.data?.before?.data();
  if (!data) return;

  // Only trigger if it was just created, or if currentGeneration changed and it's still running
  // We can use a trick: to prevent infinite loops from random updates, only proceed if status is running
  // and we haven't already processed this generation.
  // Actually, wait, if we process a generation, we increment currentGeneration, which triggers this function again!
  // That's exactly the recursive loop we want. But we must be careful not to trigger if we just updated history but not generation.
  if (data.status !== 'running') return;
  if (prevData && prevData.status === 'running' && prevData.currentGeneration === data.currentGeneration) {
    // Already processed or some other field updated
    return;
  }

  const { currentGeneration, config, gameType } = data;
  
  const simRef = db.collection('genetic_simulations').doc(event.params.simId);

  if (currentGeneration > config.numGenerations) {
    return simRef.update({ status: 'finished' });
  }

  const pop = JSON.parse(data.population);
  const gamesPerGen = config.gamesPerGen;

  let reducer: any;
  let initialState: any;
  if (gameType === 'flips') {
    reducer = flipsReducer;
    initialState = initialFlipsState;
  } else {
    reducer = kingOfTokyoReducer;
    initialState = initialKotState;
  }

  console.log(`Starting Genetic Sim ${event.params.simId} Gen ${currentGeneration} (${gamesPerGen} games)`);
  
  // Dynamically calculate a batch size so we get at least 10 progress updates per generation
  // Cap it at max 1000 to keep the event loop somewhat responsive
  const BATCH_SIZE = Math.max(10, Math.min(1000, Math.floor(gamesPerGen / 10)));
  let gamesCompleted = 0;

  while (gamesCompleted < gamesPerGen) {
    const chunk = Math.min(BATCH_SIZE, gamesPerGen - gamesCompleted);
    for (let i = 0; i < chunk; i++) {
      const gamePlayersCount = Math.floor(Math.random() * 5) + 2; // 2 to 6
      const pConfigs: any[] = [];
      const selectedBots: any[] = [];
      
      for (let p = 0; p < gamePlayersCount; p++) {
        const bot = pop[Math.floor(Math.random() * pop.length)];
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

    gamesCompleted += chunk;
    
    // Update progress in Firestore so the UI sees it
    await simRef.update({ gamesCompleted });
    
    // Yield to the event loop so the Firebase SDK can actually send the network request
    await new Promise(r => setTimeout(r, 10));
  }

  // Evolve!
  const best = [...pop].sort((a,b) => (b.wins / Math.max(1, b.gamesPlayed)) - (a.wins / Math.max(1, a.gamesPlayed)))[0];
  const newPop = evolvePopulation(pop, currentGeneration);

  const newHistory = [...(data.history || []), {
    generation: currentGeneration,
    bestDna: best.dna,
    wins: best.wins,
    gamesPlayed: best.gamesPlayed
  }];

  await simRef.update({
    currentGeneration: currentGeneration + 1,
    gamesCompleted: 0,
    population: JSON.stringify(newPop),
    history: newHistory,
    updatedAt: FieldValue.serverTimestamp()
  });
});
