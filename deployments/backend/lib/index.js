"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.dispatchAction = exports.createGame = void 0;
// Mock CSS imports so Node.js doesn't crash on shared UI code
require.extensions['.css'] = () => { };
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const reducer_1 = require("@erez/flips/dist/engine/reducer");
admin.initializeApp();
const db = admin.firestore();
exports.createGame = (0, https_1.onCall)(async (request) => {
    const { gameType, requestedId } = request.data;
    if (!gameType)
        throw new https_1.HttpsError('invalid-argument', 'gameType is required');
    const gameRef = requestedId ? db.collection('games').doc(requestedId) : db.collection('games').doc();
    const gameId = gameRef.id;
    const doc = await gameRef.get();
    if (doc.exists)
        return { gameId };
    let state;
    if (gameType === 'flips') {
        state = reducer_1.initialFlipsState;
    }
    else {
        throw new https_1.HttpsError('invalid-argument', 'Unsupported game type');
    }
    await gameRef.set({
        gameType,
        state,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { gameId };
});
exports.dispatchAction = (0, https_1.onCall)(async (request) => {
    const { gameId, action, gameType } = request.data;
    if (!gameId || !action || !gameType) {
        throw new https_1.HttpsError('invalid-argument', 'gameId, gameType, and action are required');
    }
    const gameRef = db.collection('games').doc(gameId);
    await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(gameRef);
        if (!doc.exists) {
            throw new https_1.HttpsError('not-found', 'Game not found');
        }
        const gameDoc = doc.data();
        let newState;
        if (gameType === 'flips') {
            newState = (0, reducer_1.flipsReducer)(gameDoc.state, action);
        }
        else {
            throw new https_1.HttpsError('invalid-argument', 'Unsupported game type');
        }
        transaction.update(gameRef, { state: newState });
    });
    return { success: true };
});
//# sourceMappingURL=index.js.map