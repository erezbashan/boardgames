const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf8');

content = content.replace(
  `if (l === \`TURN_START:\${myName}\` || l === \`Turn ended. It is now \${myName}'s turn.\` || l === 'Game started!') {`,
  `if (l === \`TURN_START:\${myName}\` || l === 'Game started!') {`
);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf8');
