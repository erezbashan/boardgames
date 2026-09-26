import re

with open('games/dominion/src/engine/reducer.ts', 'r') as f:
    code = f.read()

# Fix DRAW_CARDS to queue SHUFFLE_DISCARD if deck is empty
old_draw = """      case 'DRAW_CARDS': {
        if (pending.amount > 0) {
          state.actionQueue = state.actionQueue || [];
          state.actionQueue.push({ delayMs: 250, action: { type: 'DRAW_CARDS_ASYNC', playerId: pending.playerId, amount: pending.amount } });
        }
        break;
      }"""
new_draw = """      case 'DRAW_CARDS': {
        if (pending.amount > 0) {
          state.actionQueue = state.actionQueue || [];
          state.actionQueue.push({ delayMs: 250, action: { type: 'DRAW_CARDS_ASYNC', playerId: pending.playerId, amount: pending.amount } });
        }
        break;
      }"""
# Wait, DRAW_CARDS_ASYNC is the one that does the deck.length === 0 check! Let's patch DRAW_CARDS_ASYNC!
