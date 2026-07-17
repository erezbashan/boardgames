const fs = require('fs');

let app = fs.readFileSync('frontend/src/App.tsx', 'utf8');

app = app.replace(
  /onLobbyReturn=\{[^\}]+\}/,
  ``
);

fs.writeFileSync('frontend/src/App.tsx', app, 'utf8');
