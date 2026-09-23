const fs = require('fs');
const file = 'games/acquire/src/components/AcquireBoard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /<div \n                    key=\{cIdx\} \n                    className=\{`board-cell \$\{cell \?\? ''\} \$\{isPlayable \? 'playable' : ''\} \$\{isPulsing \? 'pulsing' : ''\}`\}/,
  '<div \n                    key={cIdx} \n                    className={`board-cell ${cell ?? \'\'} ${isPlayable ? \'playable\' : \'\'} ${isPulsing ? \'pulsing\' : \'\'} ${state.turnContext?.lastPlacedTile === cellId ? \'just-placed\' : \'\'}`}'
);
fs.writeFileSync(file, content);
