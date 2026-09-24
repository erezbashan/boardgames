const fs = require('fs');
const file = 'games/acquire/src/engine/engine.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /export function buyStock[\s\S]*?return newState;\n\}/;
const replacement = `export function buyStock(state: AcquireState, playerId: string, corpName: Corporation): AcquireState {
  if (state.phase !== 'BuyStocks' || state.playerOrder[state.currentPlayerIndex] !== playerId) return state;
  if (state.sharesBoughtThisTurn >= 3) return state;

  const corp = state.corporations[corpName];
  if (!corp.isActive || corp.availableStocks <= 0) return state;

  const player = state.players[playerId];
  if (!player) return state;
  if (player.money < corp.stockPrice) return state;

  const beforeRanks = getRankings(state, corpName);
  const newState = { ...state };
  newState.corporations = { ...newState.corporations };
  newState.corporations[corpName] = { ...corp, availableStocks: corp.availableStocks - 1 };

  const newPlayers = { ...newState.players };
  newPlayers[playerId] = {
    ...player,
    money: player.money - corp.stockPrice,
    stocks: { ...player.stocks, [corpName]: (player.stocks[corpName] || 0) + 1 },
    stats: { ...player.stats, sharesBought: (player.stats?.sharesBought || 0) + 1 }
  };
  newState.players = newPlayers;
  newState.sharesBoughtThisTurn = (newState.sharesBoughtThisTurn || 0) + 1;
  
  newState.turnContext = { ...newState.turnContext };
  if (!newState.turnContext.startOfTurnRanks) newState.turnContext.startOfTurnRanks = {};
  if (!newState.turnContext.startOfTurnRanks[corpName]) {
    newState.turnContext.startOfTurnRanks[corpName] = beforeRanks;
  }
  
  let newLogs = [...newState.logs];
  let foundBuyLog = false;
  
  for (let i = newLogs.length - 1; i >= Math.max(0, newLogs.length - 10); i--) {
    const log = newLogs[i];
    if (log.includes('Turn ---')) break;
    
    if (log.includes(player.name) && log.includes(corpName) && 
       (log.includes('place in') || log.includes('tied with') || log.includes('deposed') || log.includes('shakes up'))) {
      newLogs.splice(i, 1);
      continue;
    }
    
    if (!foundBuyLog) {
      const match = log.match(new RegExp(\`^\${player.name} bought (\\\\d+) shares? of \${corpName}\\\\.?$\`));
      if (match) {
        const prevCount = parseInt(match[1], 10);
        newLogs[i] = \`\${player.name} bought \${prevCount + 1} shares of \${corpName}\`;
        foundBuyLog = true;
      }
    }
  }
  
  if (!foundBuyLog) {
    newLogs.push(\`\${player.name} bought 1 share of \${corpName}\`);
  }
  newState.logs = newLogs;

  const afterRanks = getRankings(newState, corpName);
  const startRanks = newState.turnContext.startOfTurnRanks[corpName];

  if (startRanks.first.join(',') !== afterRanks.first.join(',') || startRanks.second.join(',') !== afterRanks.second.join(',')) {
    const isFirst = afterRanks.first.includes(playerId);
    const isSharedFirst = isFirst && afterRanks.first.length > 1;
    const isSecond = afterRanks.second.includes(playerId);
    
    let msg = '';
    
    if (isFirst && !isSharedFirst) {
      const deposed = startRanks.first.filter(id => id !== playerId).map(id => newState.players[id].name);
      if (deposed.length > 0) {
        msg = \`\${player.name} deposed \${deposed.join(' and ')} to take sole 1st place in \${corpName}!\`;
      } else {
        msg = \`\${player.name} took sole 1st place in \${corpName}!\`;
      }
    } else if (isFirst) {
      const tiedWith = afterRanks.first.filter(id => id !== playerId).map(id => newState.players[id].name);
      msg = \`\${player.name} tied with \${tiedWith.join(' and ')} for 1st place in \${corpName}!\`;
    } else if (isSecond) {
      const tiedWith = afterRanks.second.filter(id => id !== playerId).map(id => newState.players[id].name);
      if (tiedWith.length > 0) {
        msg = \`\${player.name} tied with \${tiedWith.join(' and ')} for 2nd place in \${corpName}!\`;
      } else {
        const deposed = startRanks.second.filter(id => id !== playerId).map(id => newState.players[id].name);
        if (deposed.length > 0) {
           msg = \`\${player.name} deposed \${deposed.join(' and ')} to take 2nd place in \${corpName}!\`;
        } else {
           msg = \`\${player.name} moved up to 2nd place in \${corpName}!\`;
        }
      }
    }
    
    if (msg) {
      newState.logs.push(msg);
      newState.turnContext = { ...newState.turnContext, rankChange: { corp: corpName, triggerPlayerId: playerId } };
    }
  }

  return newState;
}`;

content = content.replace(regex, () => replacement);
fs.writeFileSync(file, content);
