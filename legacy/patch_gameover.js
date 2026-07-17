const fs = require('fs');
let content = fs.readFileSync('frontend/src/GameOverScreen.tsx', 'utf8');

// Remove Final VP and Final Health from Table Headers
content = content.replace(
  /<th style={{ padding: '8px' }}>Final VP<\/th>\s*<th style={{ padding: '8px' }}>Final Health<\/th>/,
  ''
);

// Remove Final VP and Final Health from Table Body
content = content.replace(
  /<td style={{ padding: '8px' }}>{p\.victoryPoints}<\/td>\s*<td style={{ padding: '8px' }}>{p\.health > 0 \? p\.health : '💀 0'}<\/td>/,
  ''
);

// Update colors array to rely on p.color
// Replace the hardcoded colors array line with nothing, we won't need it.
content = content.replace(
  `const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#387908', '#d0ed57'];`,
  `// colors replaced by p.color`
);

// Replace Table row color
content = content.replace(
  `color: colors[index % colors.length]`,
  `color: p.color || 'white'`
);

// Replace Graph Line color
content = content.replace(
  `stroke={colors[index % colors.length]}`,
  `stroke={gameState.players[id]?.color || '#8884d8'}`
);

content = content.replace(
  `stroke={colors[index % colors.length]}`,
  `stroke={gameState.players[id]?.color || '#8884d8'}`
);

content = content.replace(
  `stroke={colors[index % colors.length]}`,
  `stroke={gameState.players[id]?.color || '#8884d8'}`
);


fs.writeFileSync('frontend/src/GameOverScreen.tsx', content, 'utf8');
