const fs = require('fs');
let content = fs.readFileSync('frontend/src/GameOverScreen.tsx', 'utf8');

// 1. Update graph data to truncate dead players
content = content.replace(
  `      const turnData: any = { name: \`Turn \${turn}\` };
      Object.entries(h.players).forEach(([id, p]: [string, any]) => {
        turnData[id] = p.victoryPoints;
      });
      return turnData;
    });`,
  `      const turnData: any = { name: \`Turn \${turn}\` };
      Object.entries(h.players).forEach(([id, p]: [string, any]) => {
        // If a player is dead and this turn is strictly greater than the turn they died,
        // we omit them from the graph data so their line stops.
        const turnDied = p.gameStats?.turnDied;
        if (p.health <= 0 && turnDied !== undefined && turn > turnDied) {
          return; // Omit
        }
        turnData[id] = p.victoryPoints;
      });
      return turnData;
    });`
);

// 2. Add custom dot renderer for the dead icon
const customDotStr = `
const renderCustomDot = (props: any) => {
  const { cx, cy, payload, dataKey, index } = props;
  const isLastPoint = index === graphData.length - 1 || payload[dataKey] !== undefined && graphData[index + 1]?.[dataKey] === undefined;
  const p = gameState.players[dataKey];
  if (isLastPoint && p && p.health <= 0) {
    return (
      <text x={cx} y={cy} dy={4} dx={-6} fontSize="12">💀</text>
    );
  }
  return null;
};
`;

content = content.replace(
  `export function GameOverScreen({ gameState, onClose }: { gameState: any; onClose: () => void }) {`,
  `export function GameOverScreen({ gameState, onClose }: { gameState: any; onClose: () => void }) {\n${customDotStr}`
);

// Add dot={renderCustomDot} to the Line components
content = content.replace(
  /<Line\s+key=\{id\}\s+type="monotone"\s+dataKey=\{id\}\s+stroke=\{gameState\.players\[id\]\?\.color \|\| '#8884d8'\}\s+strokeWidth=\{3\}\s+\/>/g,
  `<Line key={id} type="monotone" dataKey={id} stroke={gameState.players[id]?.color || '#8884d8'} strokeWidth={3} dot={renderCustomDot} activeDot={{ r: 6 }} connectNulls={false} />`
);

fs.writeFileSync('frontend/src/GameOverScreen.tsx', content, 'utf8');
