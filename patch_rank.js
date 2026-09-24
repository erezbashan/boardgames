const fs = require('fs');
const file = 'games/acquire/src/engine/engine.ts';
let content = fs.readFileSync(file, 'utf8');

const oldCode = `  const afterRanks = getRankings(newState, corpName);
  if (beforeRanks.first.join(',') !== afterRanks.first.join(',') || beforeRanks.second.join(',') !== afterRanks.second.join(',')) {
    let msg = player.name + ' shakes up the ' + corpName + ' shareholder rankings!';
    
    const isFirst = afterRanks.first.includes(playerId);
    const isSharedFirst = isFirst && afterRanks.first.length > 1;
    const isSecond = afterRanks.second.includes(playerId);

    if (isFirst && !isSharedFirst) {
      msg = player.name + ' took sole 1st place in ' + corpName + '!';
    } else if (isFirst) {
      msg = player.name + ' took 1st place in ' + corpName + '!';
    } else if (isSecond) {
      msg = player.name + ' moved up to 2nd place in ' + corpName + '!';
    }

    newState.logs.push(msg);
    newState.turnContext = { ...newState.turnContext, rankChange: { corp: corpName, triggerPlayerId: playerId } };
  }`;

const newCode = `  const afterRanks = getRankings(newState, corpName);
  
  // Track start of turn ranks for rich messages
  newState.turnContext = { ...newState.turnContext };
  if (!newState.turnContext.startOfTurnRanks) newState.turnContext.startOfTurnRanks = {};
  if (!newState.turnContext.startOfTurnRanks[corpName]) {
    // If this is the first share they buy this turn, beforeRanks is the start of turn rank!
    // But what if they already bought a share? We should have recorded it on the first buy!
    // Wait, we can just subtract sharesBoughtThisTurn? No, they might have bought other corps.
    // Let's just trust that if it's not there, beforeRanks is accurate.
    newState.turnContext.startOfTurnRanks[corpName] = beforeRanks;
  }
  
  const startRanks = newState.turnContext.startOfTurnRanks[corpName];

  if (startRanks.first.join(',') !== afterRanks.first.join(',') || startRanks.second.join(',') !== afterRanks.second.join(',')) {
    // Rank changed since the START of the turn!
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
      // Find and remove any EXISTING rank message for this corp this turn so we can REPLACE it
      let newLogs = [...newState.logs];
      for (let i = newLogs.length - 1; i >= Math.max(0, newLogs.length - 10); i--) {
        const log = newLogs[i];
        if (log.includes('Turn ---')) break;
        if (log.includes(player.name) && log.includes(corpName) && (log.includes('place in') || log.includes('tied with'))) {
          newLogs.splice(i, 1);
        }
      }
      newLogs.push(msg);
      newState.logs = newLogs;
    }

    newState.turnContext = { ...newState.turnContext, rankChange: { corp: corpName, triggerPlayerId: playerId } };
  }`;

content = content.replace(oldCode, () => newCode);
fs.writeFileSync(file, content);
