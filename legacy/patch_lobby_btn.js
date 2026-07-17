const fs = require('fs');

let app = fs.readFileSync('frontend/src/App.tsx', 'utf8');

app = app.replace(
  `<button onClick={() => window.location.href = '/'} className="btn danger">New Game</button>`,
  `<button onClick={() => window.location.href = '/'} className="btn danger">New Game</button>\n            <button onClick={() => window.location.href = '/'} className="btn secondary">Back to Lobby</button>`
);

fs.writeFileSync('frontend/src/App.tsx', app, 'utf8');
