const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.css', 'utf8');

// Sync pulse to 1.5s
content = content.replace(
  `animation: pulse 2s infinite;`,
  `animation: pulse 1.5s infinite;`
);

// Sync btn.flash to 1.5s
content = content.replace(
  `animation: flash-btn 1s infinite;`,
  `animation: flash-btn 1.5s infinite;`
);

fs.writeFileSync('frontend/src/App.css', content, 'utf8');
