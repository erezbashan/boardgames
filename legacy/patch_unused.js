const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf8');
content = content.replace("import type { Player, DiceRoll, Card, GameState } from '@king-of-tokyo/shared';", "import type { Card, GameState } from '@king-of-tokyo/shared';");
content = content.replace("const hasAutoJoined = useRef(false);\n", "");
fs.writeFileSync('frontend/src/App.tsx', content, 'utf8');
