const fs = require('fs');
let content = fs.readFileSync('backend/src/index.ts', 'utf8');

const targetStr = `  const pIndex = game.playerOrder.indexOf(p.id);
  const prevId = game.playerOrder[(pIndex - 1 + game.playerOrder.length) % game.playerOrder.length];
  const nextId = game.playerOrder[(pIndex + 1) % game.playerOrder.length];
  const neighbors = [prevId, nextId];`;

const newStr = `  const aliveOrder = game.playerOrder.filter(id => game.players[id] && game.players[id].health > 0);
  const aliveIndex = aliveOrder.indexOf(p.id);
  let neighbors: string[] = [];
  if (aliveOrder.length > 2) {
    const prevId = aliveOrder[(aliveIndex - 1 + aliveOrder.length) % aliveOrder.length];
    const nextId = aliveOrder[(aliveIndex + 1) % aliveOrder.length];
    neighbors = [prevId, nextId];
  } else if (aliveOrder.length === 2) {
    neighbors = [aliveOrder.find(id => id !== p.id)!];
  }`;

content = content.replace(targetStr, newStr);

fs.writeFileSync('backend/src/index.ts', content, 'utf8');
