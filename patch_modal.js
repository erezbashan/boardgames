const fs = require('fs');
const file = 'packages/boardgame-core/src/components/Modal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /style=\{inline \? \{ position: 'absolute', zIndex: 50, borderRadius: '12px' \} : \{\}\}/g,
  "style={inline ? { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 50, borderRadius: '12px' } : {}}"
);

content = content.replace(
  /style=\{\{ maxWidth: width \|\| '600px' \}\}/g,
  "style={{ maxWidth: width || '600px', background: inline ? 'rgba(20, 20, 25, 0.8)' : undefined }}"
);

fs.writeFileSync(file, content);
