const fs = require('fs');
const file = 'packages/boardgame-core/src/components/GameLayout.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const myPlayerName = playersMap\[myPlayerId\]\?\.name;/,
  `const myPlayerName = playersMap[myPlayerId]?.name;
                const turnMarkerRegex = new RegExp(\`\\b\${myPlayerName?.replace(/[.*+?^$\\{\\}()|[\\]\\\\]/g, '\\\\$&')}'s Turn ---\\b\`);`
);

content = content.replace(
  /logs\[i\]\.includes\(\`\$\{myPlayerName\}'s Turn ---\`\)/g,
  `logs[i].includes(\`\${myPlayerName}'s Turn ---\`)`
);

fs.writeFileSync(file, content);
