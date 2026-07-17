const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf8');

content = content.replace(/import React, \{/g, 'import {');

fs.writeFileSync('frontend/src/App.tsx', content, 'utf8');
