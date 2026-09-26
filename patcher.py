import re

with open('games/dominion/src/engine/reducer.ts', 'r') as f:
    code = f.read()

# 1. START_GAME: replace DRAW_CARDS pending actions with sequential actionQueue
start_game_pattern = r"      for \(const pid of nextState\.playerOrder\) \{\n        nextState\.pendingActions\.push\(\{ type: 'DRAW_CARDS', playerId: pid, amount: 5 \}\);\n      \}\n      nextState\.currentPlayerIndex = 0;\n      nextState\.phase = 'ACTION';\n      const firstPlayerId = nextState\.playerOrder\[0\];\n\n      const firstPlayer = nextState\.players\[firstPlayerId\];\n      nextState\.logs\.push\(`-- \$\{firstPlayer\.name\}'s turn starts --`\);\n      nextState\.players\[firstPlayerId\]\.actions = 1;\n      nextState\.players\[firstPlayerId\]\.buys = 1;\n"

start_game_repl = """      nextState.currentPlayerIndex = 0;
      nextState.phase = 'ACTION';
      const firstPlayerId = nextState.playerOrder[0];

      let chain = { type: 'START_TURN', playerId: firstPlayerId };
      for (let i = nextState.playerOrder.length - 1; i >= 0; i--) {
         chain = { type: 'DRAW_CARDS_ASYNC', playerId: nextState.playerOrder[i], amount: 5, onComplete: chain };
      }
      nextState.actionQueue = nextState.actionQueue || [];
      nextState.actionQueue.push({ delayMs: 250, action: chain });
"""
code = re.sub(start_game_pattern, start_game_repl, code)

# 2. DRAW_CARDS_ASYNC: combine logs, add onComplete
draw_async_pattern = r"    case 'DRAW_CARDS_ASYNC': \{(.*?)\n      if \(action\.amount > 1\) \{(.*?)\}\n      break;\n    \}"

draw_async_repl = """    case 'DRAW_CARDS_ASYNC': {
      if (nextState.status !== 'Playing') break;
      const player = nextState.players[action.playerId];
      if (!player) break;
      
      if (player.deck.length === 0) {
        if (player.discard.length === 0) {
           if (action.onComplete) {
              nextState.actionQueue = nextState.actionQueue || [];
              nextState.actionQueue.push({ delayMs: 250, action: action.onComplete });
           }
           break; 
        }
        player.deck = shuffle([...player.discard]);
        player.discard = [];
        nextState.logs.push(`${player.name} shuffles their discard pile`);
      }
      const card = player.deck.pop();
      if (card) {
        player.hand.push(card);
        const lastLog = nextState.logs[nextState.logs.length - 1];
        const match = lastLog?.match(new RegExp(`^${player.name} draws (?:a|(\\\\d+)) cards?$`));
        if (match) {
           const count = match[1] ? parseInt(match[1]) + 1 : 2;
           nextState.logs[nextState.logs.length - 1] = `${player.name} draws ${count} cards`;
        } else {
           nextState.logs.push(`${player.name} draws a card`);
        }
      }
      
      if (action.amount > 1) {
        nextState.actionQueue = nextState.actionQueue || [];
        nextState.actionQueue.push({ delayMs: 250, action: { type: 'DRAW_CARDS_ASYNC', playerId: action.playerId, amount: action.amount - 1, onComplete: action.onComplete } });
      } else if (action.onComplete) {
        nextState.actionQueue = nextState.actionQueue || [];
        nextState.actionQueue.push({ delayMs: 250, action: action.onComplete });
      }
      break;
    }"""
code = re.sub(draw_async_pattern, draw_async_repl, code, flags=re.DOTALL)

# 3. AUTO_PLAY_TREASURES: combine logs, change delay to 250
auto_play_pattern = r"    case 'AUTO_PLAY_TREASURES': \{(.*?)\n        nextState\.logs\.push\(`-- \$\{player\.name\} moves \[\$\{def\.name\}\] to play area --`\);\n\n        if \(treasures\.length > 1\) \{(.*?)\}\n      \}\n      break;\n    \}"

auto_play_repl = """    case 'AUTO_PLAY_TREASURES': {
      if (nextState.status !== 'Playing') break;
      const player = nextState.players[action.playerId];
      if (!player) break;
      const treasures = player.hand.filter((c: any) => getCardDef(c.cardId).types.includes('TREASURE'));
      if (treasures.length > 0) {
        const t = treasures[0]; // just one!
        player.hand = player.hand.filter((c: any) => c.id !== t.id);
        player.playArea.push(t);
        const def = getCardDef(t.cardId);
        if (def.name === 'Copper') player.coins += 1;
        if (def.name === 'Silver') player.coins += 2;
        if (def.name === 'Gold') player.coins += 3;
        
        const lastLog = nextState.logs[nextState.logs.length - 1];
        const match = lastLog?.match(new RegExp(`^${player.name} moves (?:a|(\\\\d+)) treasures? to play area$`));
        if (match) {
           const count = match[1] ? parseInt(match[1]) + 1 : 2;
           nextState.logs[nextState.logs.length - 1] = `${player.name} moves ${count} treasures to play area`;
        } else {
           nextState.logs.push(`${player.name} moves a treasure to play area`);
        }

        if (treasures.length > 1) {
           nextState.actionQueue = nextState.actionQueue || [];
           nextState.actionQueue.push({ delayMs: 250, action: { type: 'AUTO_PLAY_TREASURES', playerId: action.playerId }});
        }
      }
      break;
    }"""
code = re.sub(auto_play_pattern, auto_play_repl, code, flags=re.DOTALL)


# 4. END_PHASE: Convert to CLEANUP_PHASE and START_TURN
end_phase_pattern = r"    case 'END_PHASE': \{(.*?)\n        nextState\.logs\.push\(`-- \$\{nextPlayer\.name\}'s turn starts --`\);\n      \}\n      break;\n    \}"

end_phase_repl = """    case 'END_PHASE': {
      if (nextState.playerOrder[nextState.currentPlayerIndex] !== action.playerId) break;
      
      if (nextState.phase === 'ACTION') {
        nextState.phase = 'BUY';
        nextState.actionQueue = nextState.actionQueue || [];
        nextState.actionQueue.push({ delayMs: 500, action: { type: 'AUTO_PLAY_TREASURES', playerId: action.playerId } });
      } else if (nextState.phase === 'BUY') {
        const player = nextState.players[action.playerId];
        nextState.logs.push(`-- ${player.name}'s turn ends --`);
        nextState.actionQueue = nextState.actionQueue || [];
        nextState.actionQueue.push({ delayMs: 500, action: { type: 'CLEANUP_PHASE', playerId: action.playerId } });
      }
      break;
    }
    case 'CLEANUP_PHASE': {
      const player = nextState.players[action.playerId];
      player.discard.push(...player.playArea, ...player.hand);
      player.playArea = [];
      player.hand = [];
      player.coins = 0;
      player.actions = 0;
      player.buys = 0;
      
      nextState.logs.push(`${player.name} sweeps cards to discard`);

      const nextPlayerIndex = (nextState.playerOrder.indexOf(action.playerId) + 1) % nextState.playerOrder.length;
      const nextPlayerId = nextState.playerOrder[nextPlayerIndex];

      nextState.actionQueue = nextState.actionQueue || [];
      nextState.actionQueue.push({ delayMs: 250, action: { 
         type: 'DRAW_CARDS_ASYNC', 
         playerId: action.playerId, 
         amount: 5,
         onComplete: { type: 'START_TURN', playerId: nextPlayerId }
      }});
      break;
    }
    case 'START_TURN': {
      nextState.currentPlayerIndex = nextState.playerOrder.indexOf(action.playerId);
      const nextPlayer = nextState.players[action.playerId];
      nextState.phase = 'ACTION';
      nextPlayer.actions = 1;
      nextPlayer.buys = 1;
      nextState.logs.push(`-- ${nextPlayer.name}'s turn starts --`);
      break;
    }"""
code = re.sub(end_phase_pattern, end_phase_repl, code, flags=re.DOTALL)


# 5. DRAW_CARDS inside processPendingActions
draw_cards_pattern = r"          player\.hand\.push\(card\);\n          state\.logs\.push\(`-- \$\{player\.name\} draws a card --`\);\n"

draw_cards_repl = """          player.hand.push(card);
          const lastLog = state.logs[state.logs.length - 1];
          const match = lastLog?.match(new RegExp(`^${player.name} draws (?:a|(\\\\d+)) cards?$`));
          if (match) {
             const count = match[1] ? parseInt(match[1]) + 1 : 2;
             state.logs[state.logs.length - 1] = `${player.name} draws ${count} cards`;
          } else {
             state.logs.push(`${player.name} draws a card`);
          }\n"""
code = re.sub(draw_cards_pattern, draw_cards_repl, code)

# 6. Auto skip fix
auto_skip_pattern = r"  if \(nextState\.status === 'Playing' && nextState\.phase === 'ACTION' && nextState\.pendingActions\.length === 0\) \{"
auto_skip_repl = "  if (nextState.status === 'Playing' && (!nextState.actionQueue || nextState.actionQueue.length === 0) && nextState.phase === 'ACTION' && nextState.pendingActions.length === 0) {"
code = code.replace(auto_skip_pattern, auto_skip_repl)

buy_skip_pattern = r"  if \(nextState\.status === 'Playing' && nextState\.phase === 'BUY' && nextState\.pendingActions\.length === 0\) \{"
buy_skip_repl = "  if (nextState.status === 'Playing' && (!nextState.actionQueue || nextState.actionQueue.length === 0) && nextState.phase === 'BUY' && nextState.pendingActions.length === 0) {"
code = code.replace(buy_skip_pattern, buy_skip_repl)


with open('games/dominion/src/engine/reducer.ts', 'w') as f:
    f.write(code)

print("Done patching")
