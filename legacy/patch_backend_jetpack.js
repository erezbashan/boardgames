const fs = require('fs');
let content = fs.readFileSync('backend/src/index.ts', 'utf8');

content = content.replace(
  /c => c\.effect\?\.jetpack/g,
  `(c: any) => c.effect?.jetpack`
);

fs.writeFileSync('backend/src/index.ts', content, 'utf8');

