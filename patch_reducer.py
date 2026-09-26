import re

with open('games/dominion/src/engine/reducer.ts', 'r') as f:
    code = f.read()

# 1. DRAW_CARDS (convert to just queuing DRAW_CARDS_ASYNC)
code = re.sub(
    r"case 'DRAW_CARDS': \{.*?break;\n      \}",
    r"case 'DRAW_CARDS': {\n        if (pending.amount > 0) {\n          state.actionQueue = state.actionQueue || [];\n          state.actionQueue.push({ delayMs: 250, action: { type: 'DRAW_CARDS_ASYNC', playerId: pending.playerId, amount: pending.amount } });\n        }\n        break;\n      }",
    code,
    flags=re.DOTALL
)

# 2. AUTO_PLAY_TREASURES log combining
# The old one is: nextState.logs.push(`${player.name} plays [${def.name}]`); (or with dot)
# Let's replace it with the combining logic.
old_auto_log = "nextState.logs.push(`${player.name} plays [${def.name}]`);"
old_auto_log_dot = "nextState.logs.push(`${player.name} plays [${def.name}].`);"

new_auto_log = """        const lastLog = nextState.logs[nextState.logs.length - 1] || "";
        const match = lastLog.match(new RegExp(`^${player.name} plays (?:(\\\\\\\\d+) )?\\\\[${def.name}\\\\]\\\\.?$`));
        if (match) {
           const count = match[1] ? parseInt(match[1]) + 1 : 2;
           nextState.logs[nextState.logs.length - 1] = `${player.name} plays ${count} [${def.name}].`;
        } else {
           nextState.logs.push(`${player.name} plays [${def.name}].`);
        }"""

code = code.replace(old_auto_log, new_auto_log)
code = code.replace(old_auto_log_dot, new_auto_log)

# 3. PLAY_CARD for treasures in BUY phase doesn't log! Let's add it.
old_play_buy = """      } else if (nextState.phase === 'BUY') {
        if (!def.types.includes('TREASURE')) break; // Can only play treasures now
        player.hand.splice(cardIndex, 1);
        player.playArea.push(card);"""

new_play_buy = """      } else if (nextState.phase === 'BUY') {
        if (!def.types.includes('TREASURE')) break; // Can only play treasures now
        player.hand.splice(cardIndex, 1);
        player.playArea.push(card);
        const lastLog = nextState.logs[nextState.logs.length - 1] || "";
        const match = lastLog.match(new RegExp(`^${player.name} plays (?:(\\\\\\\\d+) )?\\\\[${def.name}\\\\]\\\\.?$`));
        if (match) {
           const count = match[1] ? parseInt(match[1]) + 1 : 2;
           nextState.logs[nextState.logs.length - 1] = `${player.name} plays ${count} [${def.name}].`;
        } else {
           nextState.logs.push(`${player.name} plays [${def.name}].`);
        }"""
        
code = code.replace(old_play_buy, new_play_buy)

with open('games/dominion/src/engine/reducer.ts', 'w') as f:
    f.write(code)

print("Done")
