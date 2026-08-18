// Mock CSS imports so Node.js doesn't crash on shared UI code
require.extensions['.css'] = () => {};

import * as admin from "firebase-admin";
import { registerGame } from '@erez/boardgame-core';
import { flipsReducer, initialFlipsState } from '@erez/flips/dist/engine/reducer';
import { kingOfTokyoReducer, initialKotState } from '@erez/king-of-tokyo/dist/engine/reducer';

// Initialize Firebase Admin once
admin.initializeApp();
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

// Register games to the central registry so framework functions remain agnostic
registerGame('flips', { reducer: flipsReducer, initialState: initialFlipsState });
registerGame('king-of-tokyo', { reducer: kingOfTokyoReducer, initialState: initialKotState });

// Export everything from the modular files
export * from './gameplay';
export * from './genetic';
export * from './qlearning';
export * from './tournament';
