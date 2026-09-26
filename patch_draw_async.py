import re

with open('games/dominion/src/engine/reducer.ts', 'r') as f:
    code = f.read()

old_async = """    case 'DRAW_CARDS_ASYNC': {
      const player = nextState.players[action.playerId];
      if (player.deck.length === 0) {
        if (player.discard.length === 0) {
          // Can't draw anymore
          if (action.onComplete) {
            nextState.actionQueue = nextState.actionQueue || [];
            nextState.actionQueue.push({ delayMs: 250, action: action.onComplete });
          }
          break;
        }
        player.deck = shuffle([...player.discard]);
        player.discard = [];
        nextState.logs.push(`-- ${player.name} shuffles their discard pile --`);
      }
      
      const card = player.deck.pop();"""

new_async = """    case 'DRAW_CARDS_ASYNC': {
      const player = nextState.players[action.playerId];
      if (player.deck.length === 0) {
        if (player.discard.length === 0) {
          // Can't draw anymore
          if (action.onComplete) {
            nextState.actionQueue = nextState.actionQueue || [];
            nextState.actionQueue.push({ delayMs: 250, action: action.onComplete });
          }
          break;
        }
        player.deck = shuffle([...player.discard]);
        player.discard = [];
        nextState.logs.push(`-- ${player.name} shuffles their discard pile --`);
        
        // Let the shuffle animation play out on the UI for 250ms before we actually pop!
        nextState.actionQueue = nextState.actionQueue || [];
        nextState.actionQueue.unshift({ delayMs: 300, action });
        break; // Stop here, don't draw yet!
      }
      
      const card = player.deck.pop();"""

code = code.replace(old_async, new_async)

with open('games/dominion/src/engine/reducer.ts', 'w') as f:
    f.write(code)

print("Done")
