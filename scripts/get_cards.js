const fs = require('fs');
const path = require('path');
const dir = 'games/king-of-tokyo/src/engine/cards';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') && f !== 'index.ts' && f !== 'types.ts' && f !== 'registry.ts');

for (let f of files) {
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  const nameMatch = content.match(/name:\s*'([^']+)'/);
  // use regex that captures everything until the single quote that closes it
  // handle escaped single quotes if needed
  const descMatch = content.match(/description:\s*'([^']+?)'/);
  if (nameMatch && descMatch) {
    console.log(`${f} | ${nameMatch[1]} | ${descMatch[1]}`);
  }
}
