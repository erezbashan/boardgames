import re

with open('games/dominion/src/ui/DominionBoard.tsx', 'r') as f:
    code = f.read()

# Filter out Curse from the main render grid since there are no cursers in the game yet
old_grid = "{Object.keys(gameState.supply).map(cardId => {"
new_grid = "{Object.keys(gameState.supply).filter(c => c !== 'curse').map(cardId => {"
code = code.replace(old_grid, new_grid)

with open('games/dominion/src/ui/DominionBoard.tsx', 'w') as f:
    f.write(code)

print("Supply Patched")
