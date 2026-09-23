const fs = require('fs');
let css = fs.readFileSync('packages/boardgame-core/src/components/Modal.css', 'utf8');

css = css.replace(
  'background: rgba(255, 255, 255, 0.05);',
  'background: rgba(20, 20, 25, 0.95);\n  backdrop-filter: blur(12px);\n  -webkit-backdrop-filter: blur(12px);'
);

fs.writeFileSync('packages/boardgame-core/src/components/Modal.css', css);
