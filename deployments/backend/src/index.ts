// Mock CSS imports so Node.js doesn't crash on shared UI code
require.extensions['.css'] = () => {};

import * as admin from "firebase-admin";

// Initialize Firebase Admin once
admin.initializeApp();
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

// Export everything from the modular files
export * from './gameplay';
export * from './genetic';
export * from './qlearning';
