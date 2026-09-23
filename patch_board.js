const fs = require('fs');
let code = fs.readFileSync('games/acquire/src/components/AcquireBoard.tsx', 'utf8');

const targetStr = `                return (
                  <div 
                    key={cIdx} 
                    className={\`board-cell \${renderedCell ? renderedCell.toLowerCase() : ''} \${isInHand ? 'in-hand' : ''} \${isPlayable ? 'playable' : ''}\`}
                    style={{ opacity: isDefunct ? 0.6 : 1, filter: isDefunct ? 'grayscale(0.3)' : 'none' }}`;

const replacementStr = `                const isPulsing = isInHand && isMyTurn && state.phase === 'PlayTile';
                return (
                  <div 
                    key={cIdx} 
                    className={\`board-cell \${renderedCell ? renderedCell.toLowerCase() : ''} \${isInHand ? 'in-hand' : ''} \${isPlayable ? 'playable' : ''} \${isPulsing ? 'my-turn-pulse' : ''}\`}
                    style={{ 
                       opacity: isDefunct ? 0.6 : 1, 
                       filter: isDefunct ? 'grayscale(0.3)' : 'none',
                       ...(isInHand ? { 
                          borderColor: me?.color, 
                          color: me?.color, 
                          '--pulse-color': me?.color 
                       } : {})
                    } as any}`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('games/acquire/src/components/AcquireBoard.tsx', code);
