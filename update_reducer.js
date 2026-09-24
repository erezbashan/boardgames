const fs = require('fs');

let content = fs.readFileSync('games/splendor/src/reducer.ts', 'utf8');

// 1. Add scheduleBotIfNeeded function
const botHelper = `
function scheduleBotIfNeeded(state: SplendorGameState): SplendorGameState {
  if (state.status !== 'Playing') return state;
  const currentPlayerId = state.playerOrder[state.currentPlayerIndex];
  const player = state.players[currentPlayerId];
  if (!player || !player.isBot) return state;

  if (state.actionQueue && state.actionQueue.some(a => (a.action as any).type === 'PLAY_BOT')) {
    return state;
  }
  return {
    ...state,
    actionQueue: [...(state.actionQueue || []), { delayMs: 1500, action: { type: 'PLAY_BOT' } as any }]
  };
}
`;

content = content.replace('function advanceTurnOrCheckNobles', botHelper + '\nfunction advanceTurnOrCheckNobles');

// 2. Add separator in finishTurn
content = content.replace(
  'logs: [...state.logs, `It is now ${state.players[state.playerOrder[nextIndex]].name}\'s turn.`]',
  'logs: [...state.logs, `--- ${state.players[state.playerOrder[nextIndex]].name}\'s Turn ---`]'
);

// 3. Ensure all return points that finish a turn or change state call scheduleBotIfNeeded
content = content.replace(/return advanceTurnOrCheckNobles\((.*)\);/g, 'return scheduleBotIfNeeded(advanceTurnOrCheckNobles($1));');
content = content.replace(/return finishTurn\((.*)\);/g, 'return scheduleBotIfNeeded(finishTurn($1));');
content = content.replace(/initializedState\.logs = \[...initializedState\.logs, "Game started!"\];/, 
  'initializedState.logs = [...initializedState.logs, "Game started!", `--- ${initializedState.players[initializedState.playerOrder[0]].name}\\\'s Turn ---`];');
content = content.replace(/return initializedState;/, 'return scheduleBotIfNeeded(initializedState);');

// 4. Detailed gem logging in TAKE_GEMS
content = content.replace(
  'logs: [...state.logs, `${player.name} took gems.`]',
  `logs: [...state.logs, \`\${player.name} took \${Object.entries(requested).filter(([_, v]) => v > 0).map(([k, v]) => \`\${v} \${k}\`).join(', ')}.\`]`
);

// 5. Add PLAY_BOT case
const playBotCase = `
    case 'PLAY_BOT': {
      if (state.status !== 'Playing') return state;
      const playerId = state.playerOrder[state.currentPlayerIndex];
      const player = state.players[playerId];
      if (!player || !player.isBot) return state;

      if (state.turnState === 'choose_noble') {
        const nobleId = state.eligibleNoblesForCurrentPlayer[0].id;
        return splendorReducer(state, { type: 'CHOOSE_NOBLE', payload: { nobleId } } as any);
      }

      if (state.turnState === 'discard_tokens') {
        const toDiscard: Partial<GemInventory> = {};
        let count = state.pendingDiscardCount;
        const tempGems = { ...player.gems };
        while (count > 0) {
          const available = BaseGemTypes.filter(g => tempGems[g] > 0);
          if (available.length === 0) break;
          const g = available[Math.floor(Math.random() * available.length)];
          tempGems[g]--;
          toDiscard[g] = (toDiscard[g] || 0) + 1;
          count--;
        }
        return splendorReducer(state, { type: 'DISCARD_GEMS', payload: { gems: toDiscard } } as any);
      }

      for (const card of player.reservedCards) {
        if (calculatePayment(player, card)) {
          return splendorReducer(state, { type: 'PURCHASE_RESERVED_CARD', payload: { cardId: card.id } } as any);
        }
      }

      for (const tier of ['tier3', 'tier2', 'tier1'] as const) {
        for (const card of state.board[tier]) {
          if (card && calculatePayment(player, card)) {
            const tierNum = tier === 'tier1' ? 1 : tier === 'tier2' ? 2 : 3;
            return splendorReducer(state, { type: 'PURCHASE_CARD_BOARD', payload: { tier: tierNum, cardId: card.id } } as any);
          }
        }
      }

      if (Math.random() < 0.1 && player.reservedCards.length < 3) {
        if (state.decks.tier1.length > 0) {
          return splendorReducer(state, { type: 'RESERVE_CARD_DECK', payload: { tier: 1 } } as any);
        }
      }

      if (Math.random() < 0.33) {
        const availableDouble = BaseGemTypes.filter(g => state.bank[g] >= 4);
        if (availableDouble.length > 0) {
          const g = availableDouble[Math.floor(Math.random() * availableDouble.length)];
          return splendorReducer(state, { type: 'TAKE_GEMS', payload: { gems: { [g]: 2 } } } as any);
        }
      }

      const availableTypes = BaseGemTypes.filter(g => state.bank[g] > 0);
      const toTake: Partial<GemInventory> = {};
      const numToTake = Math.min(3, availableTypes.length);
      
      for (let i = availableTypes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableTypes[i], availableTypes[j]] = [availableTypes[j], availableTypes[i]];
      }

      for (let i = 0; i < numToTake; i++) {
        toTake[availableTypes[i]] = 1;
      }

      if (numToTake > 0) {
         return splendorReducer(state, { type: 'TAKE_GEMS', payload: { gems: toTake } } as any);
      } else {
         let newState: SplendorGameState = {
           ...state,
           logs: [...state.logs, \`\${player.name} passed their turn (nothing to do).\`]
         };
         return scheduleBotIfNeeded(finishTurn(newState, playerId));
      }
    }
`;

content = content.replace('default:', playBotCase + '\n    default:');

fs.writeFileSync('games/splendor/src/reducer.ts', content);
