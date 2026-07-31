import { kingOfTokyoReducer, initialKotState } from './src/engine/reducer';
import { CARD_REGISTRY } from './src/engine/cards/registry';

let st = JSON.parse(JSON.stringify(initialKotState));
st.players = {
  p1: { id: 'p1', name: 'qqq', health: 10, vp: 0, energy: 10, cards: ['acid_attack'], location: 'Outside', cardState: {} },
  p2: { id: 'p2', name: 'Charlie', health: 10, vp: 0, energy: 0, cards: [], location: 'TokyoCity', cardState: {} }
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
