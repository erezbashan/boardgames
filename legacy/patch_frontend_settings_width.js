const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf8');

content = content.replace(
  `<div className="glass-panel" style={{ padding: '16px', color: 'white' }}>
              <h3 style={{ marginTop: 0 }}>Game Settings</h3>`,
  `<div className="glass-panel" style={{ padding: '16px', color: 'white', width: 'fit-content' }}>
              <h3 style={{ marginTop: 0 }}>Game Settings</h3>`
);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf8');
