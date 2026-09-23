const fs = require('fs');
const file = 'games/acquire/src/engine/engine.ts';
let content = fs.readFileSync(file, 'utf8');

const rankLogic = `
function getRankings(state, corpName) {
  const stockHolders = Object.values(state.players).map(p => ({ id: p.id, count: p.stocks[corpName] || 0 })).filter(p => p.count > 0).sort((a, b) => b.count - a.count);
  if (stockHolders.length === 0) return { first: [], second: [] };
  const firstCount = stockHolders[0].count;
  const first = stockHolders.filter(s => s.count === firstCount).map(s => s.id);
  if (first.length > 1) return { first, second: [] };
  if (stockHolders.length === 1) return { first, second: [] };
  const secondCount = stockHolders[1].count;
  const second = stockHolders.filter(s => s.count === secondCount).map(s => s.id);
  return { first, second };
}`;

// We will inject rankLogic right before buyStock
content = content.replace(
  /export function buyStock/,
  rankLogic + '\n\nexport function buyStock'
);

// We will capture rankings before and after
const captureBefore = `
  const beforeRanks = getRankings(state, corpName);
  const newState = { ...state };`;

content = content.replace(
  /const newState = \{ \.\.\.state \};/,
  captureBefore
);

const captureAfter = `
  const afterRanks = getRankings(newState, corpName);
  
  if (beforeRanks.first.join(',') !== afterRanks.first.join(',') || beforeRanks.second.join(',') !== afterRanks.second.join(',')) {
    const afterFirstNames = afterRanks.first.map(id => newState.players[id].name);
    const msg = \`\${player.name} shakes up the \${corpName} shareholder rankings!\`;
    newState.logs.push(msg);
    newState.turnContext = { ...newState.turnContext, rankChange: { corp: corpName, triggerPlayerId: playerId } };
  }
  
  if (shouldAutoEndTurn(newState)) {`;

content = content.replace(
  /if \(shouldAutoEndTurn\(newState\)\) \{/,
  captureAfter
);

fs.writeFileSync(file, content);
