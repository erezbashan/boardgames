const fs = require('fs');
const file = 'games/acquire/src/components/AcquireBoard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /<Modal isOpen=\{true\} title="Found a Corporation" hideClose=\{true\}>/g,
  '<Modal isOpen={true} title="Found a Corporation" hideClose={true} inline={true}>'
);

content = content.replace(
  /<Modal isOpen=\{true\} title="Choose Surviving Corporation" hideClose=\{true\}>/g,
  '<Modal isOpen={true} title="Choose Surviving Corporation" hideClose={true} inline={true}>'
);

content = content.replace(
  /<Modal isOpen=\{true\} title="Resolve Merge Stocks" hideClose=\{true\}>/g,
  '<Modal isOpen={true} title="Resolve Merge Stocks" hideClose={true} inline={true}>'
);

fs.writeFileSync(file, content);
