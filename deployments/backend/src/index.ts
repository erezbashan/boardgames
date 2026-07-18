// Mock CSS imports so Node.js doesn't crash on shared UI code
require.extensions['.css'] = () => {};

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { flipsReducer, initialFlipsState, FlipsAction } from "@erez/flips/dist/engine/reducer";
import { kingOfTokyoReducer, initialKotState } from "@erez/king-of-tokyo/dist/engine/reducer";

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

    if (gameType === 'flips') {
      if (!gameDoc.state) gameDoc.state = initialFlipsState;
      newState = flipsReducer(gameDoc.state, action);
    } else if (gameType === 'king-of-tokyo') {
      if (!gameDoc.state) gameDoc.state = initialKotState;
      newState = kingOfTokyoReducer(gameDoc.state, action as any);
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

  const gameRef = event.data!.after.ref;
  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(gameRef);
    if (!doc.exists) return;
    const gameDoc = doc.data()!;
    let curState = gameDoc.state;
    
    // Safety check: Ensure the queue hasn't changed/emptied while sleeping
    if (!curState.actionQueue || curState.actionQueue.length === 0) return;

    // Pop the action
    const actionToRun = curState.actionQueue[0].action;
    curState.actionQueue = curState.actionQueue.slice(1);

    let newState;
    if (data.gameType === 'flips') {
      newState = flipsReducer(curState, actionToRun);
    } else if (data.gameType === 'king-of-tokyo') {
      newState = kingOfTokyoReducer(curState, actionToRun);
    } else {
      return; // Add other game reducers here later
    }

    transaction.update(gameRef, { state: newState });
  });
});
