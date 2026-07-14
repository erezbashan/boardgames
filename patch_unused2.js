const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf8');
content = content.replace("import type { Card, GameState } from '@king-of-tokyo/shared';\nimport type React from 'react';", "import type { Card } from '@king-of-tokyo/shared';\nimport type React from 'react';");
fs.writeFileSync('frontend/src/App.tsx', content, 'utf8');
