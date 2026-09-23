const fs = require('fs');
const file = 'packages/boardgame-core/src/components/GameLayout.tsx';
let content = fs.readFileSync(file, 'utf8');

const logCode = `                let recentLogsStartIndex = 0;
                let turnsFound = 0;
                for (let i = logs.length - 1; i >= 0; i--) {
                  if (logs[i].includes(\`'s Turn ---\`)) {
                    turnsFound++;
                    recentLogsStartIndex = i;
                    if (turnsFound === 2) {
                      break;
                    }
                  }
                }
                
                if (logs.length - recentLogsStartIndex < 5) {
                   recentLogsStartIndex = Math.max(0, logs.length - 10);
                }`;

content = content.replace(
  /let recentLogsStartIndex = 0;[\s\S]*?recentLogsStartIndex = Math\.max\(0, logs\.length - 5\);\n                \}/,
  logCode
);

fs.writeFileSync(file, content);
