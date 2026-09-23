const fs = require('fs');
const file = 'games/acquire/src/components/AcquireBoard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove renderSettings function
content = content.replace(
  /const renderSettings = \(\) => \{[\s\S]*?<\/div>\n    \);\n  \};\n/,
  ''
);

// Remove settings={renderSettings()} from GameLayout
content = content.replace(
  /\n\s*settings=\{renderSettings\(\)\}/,
  ''
);

fs.writeFileSync(file, content);
