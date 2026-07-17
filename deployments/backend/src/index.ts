// Mock CSS imports so Node.js doesn't crash on shared UI code
require.extensions['.css'] = () => {};

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { flipsReducer, initialFlipsState, FlipsAction } from "@erez/flips/dist/engine/reducer";

admin.initializeApp();
const db = getFirestore();

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
      newState = flipsReducer(gameDoc.state, action);
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
  if (!state || state.status !== 'Playing') return;

  const currentPlayerId = state.playerOrder[state.currentPlayerIndex];
  const player = state.players[currentPlayerId];
  if (!player || !player.isBot) return;

  // Wait 1.5 seconds to simulate thinking
  await new Promise(r => setTimeout(r, 1500));

  const gameRef = event.data!.after.ref;
  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(gameRef);
    if (!doc.exists) return;
    const gameDoc = doc.data()!;
    const curState = gameDoc.state;
    
    // Check if it's still this bot's turn (in case someone manually skipped or it already ran)
    if (curState.status !== 'Playing' || curState.playerOrder[curState.currentPlayerIndex] !== currentPlayerId) return;

    let newState;
    if (data.gameType === 'flips') {
      const action = { type: 'FLIP_COIN', payload: { playerId: currentPlayerId, isHeads: Math.random() > 0.5 } } as any;
      newState = flipsReducer(curState, action);
      
      // Random chatter logic
      const humanSpoke = curState.chatMessages.some((m: any) => !curState.players[m.sender]?.isBot);
      if (!humanSpoke && Math.random() > 0.7) {
        const msgs = ["I'm feeling lucky!", "Tails never fails...", "Beep boop, calculating flip...", "You humans stand no chance!"];
        const msg = msgs[Math.floor(Math.random() * msgs.length)];
        const chatAction = { type: 'SEND_CHAT_MESSAGE', payload: { sender: player.name, text: msg, color: player.color } };
        newState = flipsReducer(newState, chatAction as any);
      }
    } else {
      return; // Unsupported game type
    }

    transaction.update(gameRef, { state: newState });
  });
});
