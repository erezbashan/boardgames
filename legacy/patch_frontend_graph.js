const fs = require('fs');
let content = fs.readFileSync('frontend/src/GameOverScreen.tsx', 'utf8');

// Insert CustomDot above GameOverScreen
const customDotCode = `
const CustomDot = (props: any) => {
  const { cx, cy, payload, dataKey, playerId, gameState } = props;
  const val = payload[dataKey];
  if (val === undefined || val === null) return null;
  const p = gameState.players[playerId];
  
  const isDeathPoint = p && p.health <= 0 && p.gameStats?.turnDied && payload.name === \`Turn \${p.gameStats.turnDied + 1}\`;
  
  if (isDeathPoint) {
    return (
      <text x={cx} y={cy} dy={5} dx={-8} fill="white" fontSize="16px" style={{ zIndex: 10 }}>
        💀
      </text>
    );
  }
  return null;
};
`;

if (!content.includes('const CustomDot')) {
  content = content.replace(`export function GameOverScreen`, customDotCode + `\nexport function GameOverScreen`);
}

// Fix truncation
content = content.replace(
  `if (p.health <= 0 && p.gameStats?.turnDied && turn > p.gameStats.turnDied) {`,
  `if (p.health <= 0 && p.gameStats?.turnDied && turn > p.gameStats.turnDied + 1) {`
);

// Add custom dot to all lines
content = content.replace(
  /<Line key=\{id\} type="monotone" dataKey=\{`\$\{gameState\.players\[id\]\.name\} (VP|Health|Energy)`\} stroke=\{gameState\.players\[id\]\?\.color \|\| '#8884d8'\} strokeWidth=\{3\} dot=\{false\} \/>/g,
  (match, p1) => {
    return `<Line key={id} type="monotone" dataKey={\`\${gameState.players[id].name} ${p1}\`} stroke={gameState.players[id]?.color || '#8884d8'} strokeWidth={3} dot={<CustomDot playerId={id} gameState={gameState} />} />`;
  }
);

fs.writeFileSync('frontend/src/GameOverScreen.tsx', content, 'utf8');
