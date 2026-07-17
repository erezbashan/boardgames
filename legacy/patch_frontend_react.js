const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf8');

content = content.replace(/React\.ReactNode/g, 'any');
content = content.replace(/<React\.Fragment key={logText}>/g, '<span key={logText}>');
content = content.replace(/<\/React\.Fragment>/g, '</span>');

fs.writeFileSync('frontend/src/App.tsx', content, 'utf8');
