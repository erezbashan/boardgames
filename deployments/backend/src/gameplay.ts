import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getGame } from "@erez/boardgame-core";

export const createGame = onCall(async (request) => {
  const db = getFirestore();
  const { gameType, requestedId } = request.data;
  if (!gameType) throw new HttpsError('invalid-argument', 'gameType is required');

  const gameRef = requestedId ? db.collection('games').doc(requestedId) : db.collection('games').doc();
  const gameId = gameRef.id;

  const doc = await gameRef.get();
  if (doc.exists) return { gameId };

  let state;
  try {
    const game = getGame(gameType);
    state = game.initialState;
  } catch (err) {
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
  const db = getFirestore();
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

    try {
      const game = getGame(gameType);
      if (!gameDoc.state) gameDoc.state = game.initialState;
      // We pass the gameId into the action for logging purposes
      const actionWithGameId = { ...actionWithPlayer, gameId };
      newState = game.reducer(gameDoc.state, actionWithGameId);
    } catch (err) {
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
  const db = getFirestore();
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
    try {
      const game = getGame(data.gameType);
      const actionWithGameId = { ...actionToRun, gameId };
      newState = game.reducer(curState, actionWithGameId);
    } catch (err) {
      return;
    }

    transaction.update(gameRef, { state: newState });
  });
});
