const fs = require('fs');
const file = 'packages/boardgame-core/src/components/GameLayout.tsx';
let content = fs.readFileSync(file, 'utf8');

const bannerHtml = `{status !== 'Lobby' && (
              <>
                {status === 'Finished' && (
                  <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 500, padding: '15px 40px', background: gameState.winnerId === myPlayerId ? '#22c55e' : 'rgba(0,0,0,0.8)', color: 'white', borderRadius: '12px', textAlign: 'center', fontSize: '32px', fontWeight: 'bold', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '2px solid rgba(255,255,255,0.2)' }}>
                    {gameState.winnerId === myPlayerId ? "🏆 You Won!" : \`🏆 Winner: \${gameState.winnerId && playersMap[gameState.winnerId] ? playersMap[gameState.winnerId].name : 'Unknown'}\`}
                  </div>
                )}
                {children}
              </>
            )}`;

content = content.replace(
  /<div className="game-stage-area" style=\{\{ flex: 100 - bottomAreaRatio, overflowY: status === 'Lobby' \? 'auto' : 'hidden' \}\}>/,
  '<div className="game-stage-area" style={{ flex: 100 - bottomAreaRatio, overflowY: status === \'Lobby\' ? \'auto\' : \'hidden\', position: \'relative\' }}>'
);

content = content.replace(
  /\{status !== 'Lobby' && children\}/,
  bannerHtml
);

fs.writeFileSync(file, content);
