import re

with open('games/dominion/src/engine/reducer.ts', 'r') as f:
    code = f.read()

old_end = "  nextState = checkBotTurn(nextState);\n\n  recalculateVP(nextState);\n  return nextState;"
new_end = """  nextState = checkBotTurn(nextState);

  recalculateVP(nextState);

  // End Game Detection
  if (nextState.status === 'Playing') {
    const emptyPiles = Object.values(nextState.supply).filter(count => count === 0).length;
    if (nextState.supply['province'] === 0 || emptyPiles >= 3) {
      nextState.status = 'Finished';
      nextState.logs.push(`-- Game Over! --`);
    }
  }

  return nextState;"""

code = code.replace(old_end, new_end)

with open('games/dominion/src/engine/reducer.ts', 'w') as f:
    f.write(code)

print("Game End Patched")
