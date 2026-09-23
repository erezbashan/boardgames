const fs = require('fs');
let css = fs.readFileSync('games/acquire/src/components/AcquireBoard.css', 'utf8');

css = css.replace(/\.board-cell\.unincorporated \{[\s\S]*?\}/, `.board-cell.unincorporated {
  background: #cbd5e1 !important;
  color: #0f172a !important;
  border: 1px solid #94a3b8 !important;
  box-shadow: 0 2px 4px rgba(0,0,0,0.5);
  font-weight: 800;
}`);

fs.writeFileSync('games/acquire/src/components/AcquireBoard.css', css);
