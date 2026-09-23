const fs = require('fs');
let code = fs.readFileSync('games/king-of-tokyo/src/engine/cards/DropFromHighAltitude.ts', 'utf8');
code = code.replace(
  "description: '+ 2⭐ and take control of Tokyo. If someone is already there, they still take no damage.',",
  "description: 'Gain 2⭐ and instantly take control of Tokyo. All monsters currently in Tokyo MUST yield to you.',"
);
fs.writeFileSync('games/king-of-tokyo/src/engine/cards/DropFromHighAltitude.ts', code);
