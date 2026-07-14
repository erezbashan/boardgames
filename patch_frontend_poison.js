const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf8');

// Fix Poison rendering to add inline-block
const poisonTarget = `style={{ marginLeft: '6px', color: '#ff4444', fontWeight: 'bold', animation: 'poison-pop 0.3s ease-out' }}`;
const poisonNew = `style={{ marginLeft: '6px', color: '#ff4444', fontWeight: 'bold', display: 'inline-block', animation: 'poison-pop 0.3s ease-out' }}`;

content = content.replace(poisonTarget, poisonNew);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf8');
