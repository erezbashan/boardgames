// @ts-nocheck
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(path) {
  if (path.endsWith('.css')) return {};
  if (path === '@erez/boardgame-core') {
    return {
      baseReducer: (st, action) => ({ ...st }) // mock shallow copy
    };
  }
  return originalRequire.apply(this, arguments);
};

import { kingOfTokyoReducer, initialKotState } from './src/engine/reducer';

let st = JSON.parse(JSON.stringify(initialKotState));
st.players = {
  p1: { id: 'p1', name: 'Bob', health: 10, vp: 0, energy: 4, cards: [], location: 'Outside', cardState: {}, stats: {} },
  p2: { id: 'p2', name: 'Alice', health: 10, vp: 0, energy: 0, cards: [], location: 'Outside', cardState: {}, stats: {} }
};
st.playerOrder = ['p1', 'p2'];
st.currentPlayerIndex = 0;
st.deck = ['some_card', 'another_card'];
st.market = ['fire_breathing', 'background_dweller', 'telepath'];
st.logs = [];

st.pendingActions = [
  { type: 'BUY', playerId: 'p1', payload: { cardId: 'background_dweller', marketIndex: 1, cost: 4 } },
  { type: 'BUY_OR_SWEEP', playerId: 'p1' },
  { type: 'END_TURN', playerId: 'p1' }
];

let i = 0;
while (st.pendingActions.length > 0 && i < 20) {
  const prevLogs = st.logs.length;
  console.log("---- TICK ----", st.pendingActions.map(a => a.type));
  st = kingOfTokyoReducer(st, { type: 'NOP' });
  if (st.logs.length > prevLogs) {
    console.log("Log emitted:", st.logs[st.logs.length - 1]);
    st.actionQueue = [];
  } else {
    console.log("No logs emitted, pending after TICK:", st.pendingActions.map(a=>a.type));
  }
  i++;
}
