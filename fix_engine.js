const fs = require('fs');
const file = 'games/acquire/src/engine/engine.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const match = log\.match\(new RegExp\(\`\^\$\{player\.name\} bought \(\\\\\d\+\) shares\? of \$\{corpName\}\\\\\.\?import type \{ BoardCell, Corporation, CorporationState, AcquireState, AcquirePlayer, Tile, TileId \} from '\.\/types';/g,
  "const match = log.match(new RegExp(`^${player.name} bought (\\\\d+) shares? of ${corpName}\\\\.?$`));"
);

// We must also remove everything from line 707 down to line 1435 that was duplicated?
// Wait, when it did the replacement, did it DUPLICATE the rest of the file?!
