const fs = require('fs');
const file = 'games/acquire/src/engine/engine.ts';
let content = fs.readFileSync(file, 'utf8');

const oldCode = `  newState.sharesBoughtThisTurn = (newState.sharesBoughtThisTurn || 0) + 1;
  const lastLog = newState.logs.length > 0 ? newState.logs[newState.logs.length - 1] : '';
  const multiBuyMatch = lastLog.match(new RegExp(\`^\${player.name} bought (\\\\d+) shares? of \${corpName}\\\\.?$\`));

  if (multiBuyMatch) {
    const prevCount = parseInt(multiBuyMatch[1], 10);
    const newLogs = [...newState.logs];
    newLogs[newLogs.length - 1] = \`\${player.name} bought \${prevCount + 1} shares of \${corpName}\`;
    newState.logs = newLogs;
  } else {
    newState.logs = [...newState.logs, \`\${player.name} bought 1 share of \${corpName}\`];
  }

  const afterRanks = getRankings(newState, corpName);
  if (beforeRanks.first.join(',') !== afterRanks.first.join(',') || beforeRanks.second.join(',') !== afterRanks.second.join(',')) {
    let msg = player.name + ' shakes up the ' + corpName + ' shareholder rankings!';
    const wasFirst = beforeRanks.first.includes(playerId);
    const wasSharedFirst = wasFirst && beforeRanks.first.length > 1;
    const isFirst = afterRanks.first.includes(playerId);
    const isSharedFirst = isFirst && afterRanks.first.length > 1;
    const wasSecond = beforeRanks.second.includes(playerId);
    const isSecond = afterRanks.second.includes(playerId);

    if (isFirst && !wasFirst) {
      msg = player.name + ' took 1st place in ' + corpName + '!';
    } else if (isFirst && wasSharedFirst && !isSharedFirst) {
      msg = player.name + ' took sole 1st place in ' + corpName + '!';
    } else if (isSecond && !wasSecond && !wasFirst) {
      msg = player.name + ' moved up to 2nd place in ' + corpName + '!';
    }

    newState.logs.push(msg);
    newState.turnContext = { ...newState.turnContext, rankChange: { corp: corpName, triggerPlayerId: playerId } };
  }`;

const newCode = `  newState.sharesBoughtThisTurn = (newState.sharesBoughtThisTurn || 0) + 1;
  
  let newLogs = [...newState.logs];
  let foundBuyLog = false;
  
  // Search backward to consolidate logs
  for (let i = newLogs.length - 1; i >= Math.max(0, newLogs.length - 10); i--) {
    const log = newLogs[i];
    if (log.includes('Turn ---')) break; // don't cross turns
    
    // Remove previous rank change messages for this corp
    if (log.includes(player.name) && log.includes(corpName) && 
       (log.includes('took 1st place') || log.includes('sole 1st place') || log.includes('moved up to 2nd place') || log.includes('shakes up'))) {
      newLogs.splice(i, 1);
      continue;
    }
    
    // Consolidate buy message
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
  if (beforeRanks.first.join(',') !== afterRanks.first.join(',') || beforeRanks.second.join(',') !== afterRanks.second.join(',')) {
    let msg = player.name + ' shakes up the ' + corpName + ' shareholder rankings!';
    
    // To truly compute the rank change relative to the start of the turn, we would need the start-of-turn state.
    // However, since we cleared intermediate rank logs, just computing the delta from the immediate prior share purchase 
    // is slightly inaccurate if they jumped from unranked -> 1st over 3 shares.
    // Let's approximate it using the final state and just state their absolute current rank!
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

content = content.replace(oldCode, newCode);
fs.writeFileSync(file, content);
