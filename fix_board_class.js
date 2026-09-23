const fs = require('fs');
const file = 'games/acquire/src/components/AcquireBoard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /className=\{`board-cell \$\{renderedCell \? renderedCell\.toLowerCase\(\) : ''\} \$\{isInHand \? 'in-hand' : ''\} \$\{isPlayable \? 'playable' : ''\} \$\{isPulsing \? 'my-turn-pulse' : ''\}`\}/,
  'className={`board-cell ${renderedCell ? renderedCell.toLowerCase() : \'\'} ${isInHand ? \'in-hand\' : \'\'} ${isPlayable ? \'playable\' : \'\'} ${isPulsing ? \'my-turn-pulse\' : \'\'} ${state.turnContext?.lastPlacedTile === cellId ? \'just-placed\' : \'\'}`}'
);

fs.writeFileSync(file, content);
