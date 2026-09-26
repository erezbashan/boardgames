import re

with open('games/dominion/src/engine/reducer.ts', 'r') as f:
    code = f.read()

# 1. DRAW_CARDS (synchronous)
old1 = """          const lastLog = state.logs[state.logs.length - 1];
          const match = lastLog?.match(new RegExp(`^${player.name} draws (?:a|(\d+)) cards?$`));
          if (match) {
             const count = match[1] ? parseInt(match[1]) + 1 : 2;
             state.logs[state.logs.length - 1] = `${player.name} draws ${count} cards`;
          } else {
             state.logs.push(`${player.name} draws a card`);
          }"""
new1 = """          const lastLog = state.logs[state.logs.length - 1] || "";
          const match = lastLog.match(new RegExp(`^${player.name} draws (?:a|(\\\\d+)) cards?$`));
          if (match) {
             const count = match[1] ? parseInt(match[1]) + 1 : 2;
             state.logs[state.logs.length - 1] = `${player.name} draws ${count} cards`;
          } else {
             state.logs.push(`${player.name} draws a card`);
          }"""
code = code.replace(old1, new1)

# 2. AUTO_PLAY_TREASURES
old2 = """        const lastLog = nextState.logs[nextState.logs.length - 1];
        const match = lastLog?.match(new RegExp(`^${player.name} moves (?:a|(\d+)) treasures? to play area$`));
        if (match) {
           const count = match[1] ? parseInt(match[1]) + 1 : 2;
           nextState.logs[nextState.logs.length - 1] = `${player.name} moves ${count} treasures to play area`;
        } else {
           nextState.logs.push(`${player.name} moves a treasure to play area`);
        }"""
new2 = """        nextState.logs.push(`${player.name} plays [${def.name}]`);"""
code = code.replace(old2, new2)

# 3. DRAW_CARDS_ASYNC
old3 = """        const lastLog = nextState.logs[nextState.logs.length - 1];
        const match = lastLog?.match(new RegExp(`^${player.name} draws (?:a|(\d+)) cards?$`));
        if (match) {
           const count = match[1] ? parseInt(match[1]) + 1 : 2;
           nextState.logs[nextState.logs.length - 1] = `${player.name} draws ${count} cards`;
        } else {
           nextState.logs.push(`${player.name} draws a card`);
        }"""
new3 = """        const lastLog = nextState.logs[nextState.logs.length - 1] || "";
        const match = lastLog.match(new RegExp(`^${player.name} draws (?:a|(\\\\d+)) cards?$`));
        if (match) {
           const count = match[1] ? parseInt(match[1]) + 1 : 2;
           nextState.logs[nextState.logs.length - 1] = `${player.name} draws ${count} cards`;
        } else {
           nextState.logs.push(`${player.name} draws a card`);
        }"""
code = code.replace(old3, new3)

# 4. Remove CLEANUP_PHASE log "sweeps cards to discard" (might have failed before)
code = code.replace("nextState.logs.push(`${player.name} sweeps cards to discard`);\n", "")

with open('games/dominion/src/engine/reducer.ts', 'w') as f:
    f.write(code)

print("Done")
