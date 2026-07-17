// Mock CSS imports so Node.js doesn't crash on shared UI code
require.extensions['.css'] = () => {};

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { flipsReducer, initialFlipsState, FlipsAction } from "@erez/flips/dist/engine/reducer";

admin.initializeApp();
const db = admin.firestore();

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
  } else {
    throw new HttpsError('invalid-argument', 'Unsupported game type');
  }

  await gameRef.set({
    gameType,
    state,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
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
      newState = flipsReducer(gameDoc.state, action);
    } else {
      throw new HttpsError('invalid-argument', 'Unsupported game type');
    }

    transaction.update(gameRef, { state: newState });
  });

  return { success: true };
});
