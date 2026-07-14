const fs = require('fs');
const file = 'shared/src/index.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace("  name: string;", "  name: string;\n  color?: string;");
fs.writeFileSync(file, content, 'utf8');
