import fs from 'fs';
import path from 'path';

const file = 'frontend/src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('const [showStats, setShowStats] = useState(false);')) {
  content = content.replace(
    'const [showHelp, setShowHelp] = useState(false);',
    'const [showHelp, setShowHelp] = useState(false);\n  const [showStats, setShowStats] = useState(false);\n\n  useEffect(() => {\n    if (gameState?.status === "GameOver") {\n      setShowStats(true);\n    } else {\n      setShowStats(false);\n    }\n  }, [gameState?.status]);'
  );
}

content = content.replace(
  "  if (gameState.status === 'GameOver') {\n    return <GameOverScreen gameState={gameState} onLobbyReturn={() => socket?.emit('RETURN_TO_LOBBY', gameState.id)} />;\n  }\n\n",
  ""
);

if (!content.includes('View Stats</button>')) {
  content = content.replace(
    '<div style={{ display: \'flex\', gap: \'8px\', marginLeft: \'16px\' }}>',
    '{gameState.status === "GameOver" && (\n          <div style={{ display: "flex", gap: "8px" }}>\n            <button onClick={() => setShowStats(true)} className="btn primary">View Stats</button>\n            <button onClick={() => socket?.emit("RETURN_TO_LOBBY", gameState.id)} className="btn danger">Return to Lobby</button>\n          </div>\n        )}\n        <div style={{ display: "flex", gap: "8px", marginLeft: "16px" }}>'
  );
}

if (!content.includes('onClose={() => setShowStats(false)}')) {
  content = content.replace(
    '{showHelp && <HelpModal onClose={() => setShowHelp(false)} />}',
    '{showHelp && <HelpModal onClose={() => setShowHelp(false)} />}\n      {showStats && gameState.status === "GameOver" && (\n        <GameOverScreen \n          gameState={gameState} \n          onLobbyReturn={() => socket?.emit("RETURN_TO_LOBBY", gameState.id)} \n          onClose={() => setShowStats(false)} \n        />\n      )}'
  );
}

// Fix negative health when hit
content = content.replace(
  '<span className={`stat health ${gameState.highlightedStats?.some(s => s.playerId === p.id && s.stat === \'health\') ? \'flash\' : \'\'}`}>❤️ {p.health} / {p.maxHealth || 10}</span>',
  '<span className={`stat health ${gameState.highlightedStats?.some(s => s.playerId === p.id && s.stat === \'health\') ? \'flash\' : \'\'}`}>❤️ {Math.max(0, p.health)} / {p.maxHealth || 10}</span>'
);

fs.writeFileSync(file, content, 'utf8');
