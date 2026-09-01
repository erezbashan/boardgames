const fs = require('fs');

const mockState = {
  players: {
    'p1': {
      name: 'Eve',
      energy: 0,
      stats: { energyGained: 0 }
    }
  },
  logs: []
};

const action = {
  type: 'ENERGY',
  payload: { amount: 3 },
  playerId: 'p1'
};

const CARD_REGISTRY = {};

function addLog(st, action, str) {
  st.logs.push(str);
}

function handleEnergy(st, action, pId) {
  if (st.players[pId]) {
    st.players[pId] = { 
       ...st.players[pId], 
       energy: st.players[pId].energy + action.payload.amount,
       stats: {
           ...st.players[pId].stats,
           energyGained: (st.players[pId].stats.energyGained || 0) + (action.payload.amount > 0 ? action.payload.amount : 0)
       }
    };
    
    let sourceText = '';
    if (action.payload.sourceCard && CARD_REGISTRY[action.payload.sourceCard]) {
       sourceText = ` via ${CARD_REGISTRY[action.payload.sourceCard].name}`;
    }
    
    const reasonStr = action.payload.reason ? ` (${action.payload.reason})` : '';
    
    const amt = action.payload.amount;
    if (amt >= 0) {
       addLog(st, action, `${st.players[pId].name} gained ${amt} ⚡${reasonStr}${sourceText}`);
    } else {
       addLog(st, action, `${st.players[pId].name} lost ${Math.abs(amt)} ⚡${reasonStr}${sourceText}`);
    }
  }
}

handleEnergy(mockState, action, 'p1');
console.log(mockState);
