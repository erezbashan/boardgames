import fs from 'fs';
const file = 'frontend/src/GameOverScreen.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace("import React from 'react';\n", "");
fs.writeFileSync(file, content, 'utf8');
