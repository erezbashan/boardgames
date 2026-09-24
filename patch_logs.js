const fs = require('fs');
const file = 'packages/boardgame-core/src/components/GameLayout.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /let foundMyLastTurn = false;[\s\S]*?const renderedAllLogs = /;

const replacement = `let foundMyLastTurn = false;
                const isMyTurnCurrently = gameState?.playerOrder?.[gameState.currentPlayerIndex] === myPlayerId;
                const targetMyTurnsFound = isMyTurnCurrently ? 2 : 1;
                let myTurnsFound = 0;
                
                for (let i = logs.length - 1; i >= 0; i--) {
                  if (logs[i].includes(\`'s Turn ---\`) && myName && logs[i].includes(myName)) {
                    myTurnsFound++;
                    recentLogsStartIndex = i;
                    if (myTurnsFound === targetMyTurnsFound) {
                      foundMyLastTurn = true;
                      break;
                    }
                  }
                }
                
                // Fallback if we couldn't find my turn (e.g. spectator or start of game)
                if (!foundMyLastTurn) {
                  let turnsFound = 0;
                  for (let i = logs.length - 1; i >= 0; i--) {
                    if (logs[i].includes(\`'s Turn ---\`)) {
                      turnsFound++;
                      recentLogsStartIndex = i;
                      if (turnsFound === 5) {
                        break;
                      }
                    }
                  }
                  if (logs.length - recentLogsStartIndex < 5) {
                     recentLogsStartIndex = Math.max(0, logs.length - 10);
                  }
                }
                
                const renderedAllLogs = `;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
