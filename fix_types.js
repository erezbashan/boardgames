const fs = require('fs');
const file = 'games/acquire/src/engine/engine.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/filter\(id =>/g, "filter((id: string) =>");
content = content.replace(/map\(id =>/g, "map((id: string) =>");

fs.writeFileSync(file, content);
