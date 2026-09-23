const fs = require('fs');
const file = 'games/acquire/src/engine/engine.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. lastPlacedTile in playTile
content = content.replace(
  /const newState = \{ \.\.\.state, board: newBoard \};/,
  'const newState = { ...state, board: newBoard, turnContext: { ...state.turnContext, lastPlacedTile: tileId } };'
);

// 2. GameOver status -> Finished
content = content.replace(
  /phase: 'GameOver',/g,
  'status: \'Finished\',\n        winnerId: leader.id,\n        phase: \'GameOver\','
);

// 3. buyStock rank logic
const rankLogic = `
function getRankings(state: AcquireState, corpName: Corporation) {
  const stockHolders = Object.values(state.players).map(p => ({ id: p.id, count: p.stocks[corpName] || 0 })).filter(p => p.count > 0).sort((a, b) => b.count - a.count);
  if (stockHolders.length === 0) return { first: [] as string[], second: [] as string[] };
  const firstCount = stockHolders[0].count;
  const first = stockHolders.filter(s => s.count === firstCount).map(s => s.id);
  if (first.length > 1) return { first, second: [] };
  if (stockHolders.length === 1) return { first, second: [] };
  const secondCount = stockHolders[1].count;
  const second = stockHolders.filter(s => s.count === secondCount).map(s => s.id);
  return { first, second };
}`;

if (!content.includes('function getRankings')) {
  content = content.replace(
    /export function buyStock/,
    rankLogic + '\n\nexport function buyStock'
  );
}

// capture before inside buyStock specifically
// we find the line inside buyStock: `const newState = { ...state };`
const beforeRegex = /export function buyStock[\s\S]*?const newState = \{ \.\.\.state \};/;
const matchBefore = content.match(beforeRegex);
if (matchBefore) {
  const replacedBefore = matchBefore[0].replace(
    /const newState = \{ \.\.\.state \};/,
    'const beforeRanks = getRankings(state, corpName);\n  const newState = { ...state };'
  );
  content = content.replace(beforeRegex, replacedBefore);
}

// capture after inside buyStock specifically
// we find the line inside buyStock: `if (shouldAutoEndTurn(newState)) {`
const afterRegex = /export function buyStock[\s\S]*?if \(shouldAutoEndTurn\(newState\)\) \{/;
const matchAfter = content.match(afterRegex);
if (matchAfter) {
  const replacedAfter = matchAfter[0].replace(
    /if \(shouldAutoEndTurn\(newState\)\) \{/,
    `const afterRanks = getRankings(newState, corpName);
  if (beforeRanks.first.join(',') !== afterRanks.first.join(',') || beforeRanks.second.join(',') !== afterRanks.second.join(',')) {
    const msg = \`\${player.name} shakes up the \${corpName} shareholder rankings!\`;
    newState.logs.push(msg);
    newState.turnContext = { ...newState.turnContext, rankChange: { corp: corpName, triggerPlayerId: playerId } };
  }
  
  if (shouldAutoEndTurn(newState)) {`
  );
  content = content.replace(afterRegex, replacedAfter);
}

fs.writeFileSync(file, content);
