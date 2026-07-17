const fs = require('fs');

let content = fs.readFileSync('backend/src/index.ts', 'utf8');

// Update ROLL_DICE logic
content = content.replace(
  `        const extraDice = game.players[socket.id].cards.reduce((sum, c) => sum + (c.effect?.extraDie || 0), 0);
        game.currentDice = rollDice(6 + extraDice);`,
  `        const extraDice = game.players[socket.id].cards.reduce((sum, c) => sum + (c.effect?.extraDie || 0), 0);
        const shrink = game.players[socket.id].shrinkTokens || 0;
        const base = game.settings?.startingDice || 6;
        const numDice = Math.max(1, base + extraDice - shrink);
        game.currentDice = rollDice(numDice);`
);

// We need to also patch bots dice rolling logic!
// Let's check if bots use a different logic.
fs.writeFileSync('backend/src/index.ts', content, 'utf8');
