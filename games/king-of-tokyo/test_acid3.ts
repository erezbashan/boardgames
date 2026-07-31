import fs from 'fs';
// We need to patch require to ignore .css files
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function() {
  if (arguments[0].endsWith('.css')) return {};
  return originalRequire.apply(this, arguments);
};

import { kingOfTokyoReducer, initialKotState } from './src/engine/reducer';

let st = JSON.parse(JSON.stringify(initialKotState));
st.players = {
  p1: { id: 'p1', name: 'qqq', health: 10, vp: 0, energy: 10, cards: ['acid_attack'], location: 'TokyoCity', cardState: {} },
  p2: { id: 'p2', name: 'Alice', health: 10, vp: 0, energy: 0, cards: [], location: 'Outside', cardState: {} }
};
st.playerOrder = ['p1', 'p2'];
st.currentPlayerIndex = 0;
st.settings = { maxHealth: 10, maxVp: 20 };
st.logs = [];

st.pendingActions = [
  { type: 'END_TURN', playerId: 'p1', payload: {} }
];

while (st.pendingActions.length > 0) {
  st = kingOfTokyoReducer(st, { type: 'NOP' });
}

console.log(st.logs);
