const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf8');

// 1. Add showWinnerBanner state
content = content.replace(
  `  const [showStats, setShowStats] = useState(false);`,
  `  const [showStats, setShowStats] = useState(false);
  const [showWinnerBanner, setShowWinnerBanner] = useState(false);`
);

// 2. Modify useEffect for GameOver
content = content.replace(
  `  useEffect(() => {
    if (gameState?.status === 'GameOver') setShowStats(true);
  }, [gameState?.status]);`,
  `  useEffect(() => {
    if (gameState?.status === 'GameOver') {
      setShowWinnerBanner(true);
      setTimeout(() => {
        setShowWinnerBanner(false);
        setShowStats(true);
      }, 3000);
    } else {
      setShowWinnerBanner(false);
      setShowStats(false);
    }
  }, [gameState?.status]);`
);

// 3. Add Winner Banner render logic
const winnerBannerCode = `
      {showWinnerBanner && gameState?.winner && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', zIndex: 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          animation: 'winner-fade-in 0.5s ease-out'
        }}>
          <style>{\`
            @keyframes winner-fade-in { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
            @keyframes pulse-glow { 0% { text-shadow: 0 0 20px \${gameState.players[gameState.winner]?.color || '#ffd700'}; } 50% { text-shadow: 0 0 50px \${gameState.players[gameState.winner]?.color || '#ffd700'}, 0 0 100px \${gameState.players[gameState.winner]?.color || '#ffd700'}; } 100% { text-shadow: 0 0 20px \${gameState.players[gameState.winner]?.color || '#ffd700'}; } }
          \`}</style>
          <h1 style={{ 
            fontSize: '80px', margin: 0, 
            color: gameState.players[gameState.winner]?.color || '#ffd700',
            animation: 'pulse-glow 1.5s infinite'
          }}>
            {gameState.players[gameState.winner]?.name} WINS!
          </h1>
          <p style={{ fontSize: '24px', color: 'white', marginTop: '20px' }}>
            {gameState.players[gameState.winner]?.health > 0 ? 'By reaching 20 Victory Points!' : 'By being the last monster standing!'}
          </p>
        </div>
      )}
`;

content = content.replace(
  `      {showStats && gameState && (
        <GameOverScreen gameState={gameState} onClose={() => setShowStats(false)} />
      )}`,
  `      {showWinnerBanner && gameState?.winner && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', zIndex: 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          animation: 'winner-fade-in 0.5s ease-out'
        }}>
          <style>{\`
            @keyframes winner-fade-in { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
            @keyframes pulse-glow { 0% { text-shadow: 0 0 20px \${gameState.players[gameState.winner]?.color || '#ffd700'}; } 50% { text-shadow: 0 0 50px \${gameState.players[gameState.winner]?.color || '#ffd700'}, 0 0 100px \${gameState.players[gameState.winner]?.color || '#ffd700'}; } 100% { text-shadow: 0 0 20px \${gameState.players[gameState.winner]?.color || '#ffd700'}; } }
          \`}</style>
          <h1 style={{ 
            fontSize: '80px', margin: 0, 
            color: gameState.players[gameState.winner]?.color || '#ffd700',
            animation: 'pulse-glow 1.5s infinite'
          }}>
            {gameState.players[gameState.winner]?.name} WINS!
          </h1>
          <p style={{ fontSize: '24px', color: 'white', marginTop: '20px' }}>
            {gameState.players[gameState.winner]?.victoryPoints >= 20 ? 'By reaching 20 Victory Points!' : 'By being the last monster standing!'}
          </p>
        </div>
      )}
      
      {showStats && gameState && (
        <GameOverScreen gameState={gameState} onClose={() => setShowStats(false)} />
      )}`
);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf8');
