import { KotState, PendingAction } from '../types';

export function handleStartGame(st: KotState, action: PendingAction, pId: string) {
  const newDeck: string[] = [];
  const copies = st.settings.cardsPerType || 1;
  
  st.settings.activeCards.forEach(cardId => {
    for (let i = 0; i < copies; i++) {
      newDeck.push(cardId);
    }
  });

  // Shuffle the deck
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }

  st.deck = newDeck;
  st.market = ['', '', ''];
  st.status = 'Playing';
  st.playerOrder.forEach(id => {
    st.players[id] = { ...st.players[id], health: st.settings.maxHealth, energy: st.settings.startingEnergy, vp: 0, location: 'Outside', cards: [], stats: { healthHealed: 0, energyGained: 0, damageDealt: 0, playersKilled: 0 } };
  });
  st.pendingActions = [
      { type: 'FILL_MARKET', playerId: pId, payload: { index: 2 } },
      { type: 'FILL_MARKET', playerId: pId, payload: { index: 1 } },
      { type: 'FILL_MARKET', playerId: pId, payload: { index: 0 } },
      { type: 'START_TURN', playerId: st.playerOrder[st.currentPlayerIndex] }
  ];
}
